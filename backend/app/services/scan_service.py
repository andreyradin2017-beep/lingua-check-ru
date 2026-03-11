"""
scan_service.py — Phase 4
Управление сканами сайтов через Playwright.
На Windows используем ProactorEventLoopPolicy для корректной работы subprocess.
"""
import asyncio
import hashlib
import logging
import sys
import threading
import re
import uuid
from urllib.parse import urljoin, urlparse
from datetime import datetime, timezone

import httpx
from app.supabase_client import get_async_supabase
from app.services.token_service import analyze_text

# Установка политики для Windows (исправление NotImplementedError)
if sys.platform == "win32":
    try:
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    except AttributeError:
        # Fallback if Proactor is not available
        pass

logger = logging.getLogger(__name__)
_ACTIVE_SCANS: dict[str, dict] = {}

def _is_russian_page(text: str) -> bool:
    """Простая эвристика: есть ли в тексте кириллица."""
    return any("\u0400" <= ch <= "\u04ff" for ch in text)

def _run_scan_in_thread(scan_id: str, url: str, max_depth: int, max_pages: int) -> None:
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(_run_scan(scan_id, url, max_depth, max_pages))
    except Exception as e:
        logger.exception("Scan thread %s failed: %s", scan_id, e)
    finally:
        loop.close()

async def start_scan_background(scan_id: str, url: str, max_depth: int, max_pages: int) -> None:
    stop_event = threading.Event()
    _ACTIVE_SCANS[scan_id] = {
        "stop_event": stop_event,
        "queue_size": 0,
        "processed_count": 0
    }
    t = threading.Thread(
        target=_run_scan_in_thread,
        args=(scan_id, url, max_depth, max_pages),
        name=f"scan-{scan_id}",
        daemon=True,
    )
    t.start()
    logger.info("Scan %s: thread started", scan_id)

def stop_scan(scan_id: str) -> bool:
    if scan_id in _ACTIVE_SCANS:
        _ACTIVE_SCANS[scan_id]["stop_event"].set()
        logger.info("Scan %s: stop signal sent", scan_id)
        return True
    return False

def get_scan_metadata(scan_id: str) -> dict:
    """Возвращает метаданные активного скана (очередь, прогресс)."""
    return _ACTIVE_SCANS.get(scan_id, {})

async def _run_scan(scan_id: str, url: str, max_depth: int, max_pages: int) -> None:
    logger.info("Scan %s: starting for %s", scan_id, url)
    client = await get_async_supabase()
    try:
        await client.table("scans").update({"status": "in_progress"}).eq("id", scan_id).execute()
    except Exception as e:
        logger.error("Scan %s: failed to mark as in_progress: %s", scan_id, e)
        return

    try:
        await _scrape_site(scan_id, url, max_depth, max_pages, client)
        status = "completed"
        # Проверяем, был ли скан остановлен пользователем
        if scan_id in _ACTIVE_SCANS and _ACTIVE_SCANS[scan_id]["stop_event"].is_set():
            status = "stopped"
            
        await client.table("scans").update({
            "status": status,
            "finished_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", scan_id).execute()
        logger.info("Scan %s: %s", scan_id, status)
    except Exception as exc:
        logger.exception("Scan %s: failed — %s", scan_id, exc)
        try:
            await client.table("scans").update({"status": "failed"}).eq("id", scan_id).execute()
        except:
            pass
    finally:
        if scan_id in _ACTIVE_SCANS:
            del _ACTIVE_SCANS[scan_id]

async def _scrape_site(scan_id: str, start_url: str, max_depth: int, max_pages: int, client: any) -> None:
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        logger.error("Playwright не установлен.")
        return

    base_domain = urlparse(start_url).netloc
    visited: set[str] = set()
    queue: list[tuple[str, int]] = [(start_url, 0)]
    pages_count = 0
    stop_event = _ACTIVE_SCANS.get(scan_id, {}).get("stop_event")

    async with async_playwright() as pw:
        try:
            browser = await pw.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"]
            )
            logger.info("Scan %s: browser launched", scan_id)
        except Exception as e:
            logger.error("Scan %s: failed to launch browser: %s", scan_id, e)
            raise

        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            ignore_https_errors=True,
        )

        while queue and pages_count < max_pages:
            if stop_event and stop_event.is_set():
                break

            # Обновляем инфо об очереди
            if scan_id in _ACTIVE_SCANS:
                _ACTIVE_SCANS[scan_id]["queue_size"] = len(queue)
                _ACTIVE_SCANS[scan_id]["processed_count"] = pages_count

            current_url, depth = queue.pop(0)
            if current_url in visited:
                continue
            visited.add(current_url)

            if urlparse(current_url).netloc != base_domain:
                continue

            page_status = "ok"
            content_text = ""
            page = None

            try:
                page = await context.new_page()
                response = await page.goto(current_url, timeout=60000, wait_until="domcontentloaded")
                if not response or response.status >= 400:
                    page_status = "blocked"
                else:
                    await asyncio.sleep(1)
                    content_text = await page.evaluate(\"\"\"() => {
                        const selectors = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div', 'li', 'td', 'th', 'a', 'label', 'button'];
                        let text = '';
                        selectors.forEach(sel => {
                            document.querySelectorAll(sel).forEach(el => {
                                if (el.closest('script, style, noscript, template')) return;
                                const style = window.getComputedStyle(el);
                                if (style.display === 'none' || style.visibility === 'hidden') return;
                                text += ' ' + el.innerText;
                            });
                        });
                        return text;
                    }\"\"\")
                    
                    if not content_text or len(content_text.strip()) < 10:
                        content_text = await page.inner_text("body")
                    
                    if depth < max_depth:
                        links = await page.evaluate("() => Array.from(document.querySelectorAll('a[href]')).map(a => a.href).filter(h => h.startsWith('http'))")
                        for link in set(links):
                            link = link.split('#')[0].rstrip('/')
                            if link not in visited:
                                queue.append((link, depth + 1))
            except Exception as e:
                logger.warning("Scan %s: error %s — %s. Fallback to httpx...", scan_id, current_url, e)
                try:
                    content_text = await _fetch_with_httpx(current_url)
                    page_status = "ok" if content_text else "timeout"
                except:
                    page_status = "timeout"
            finally:
                if page:
                    try: await page.close()
                    except: pass

            try:
                page_id = str(uuid.uuid4())
                await client.table("pages").insert({
                    "id": page_id,
                    "scan_id": scan_id,
                    "url": current_url,
                    "depth": depth,
                    "status": page_status,
                    "content_hash": hashlib.md5(content_text.encode(errors='ignore')).hexdigest(),
                }).execute()
                pages_count += 1

                if content_text and page_status == "ok" and _is_russian_page(content_text):
                    result = await analyze_text(content_text, deduplicate=True)
                    violations = []
                    for v in result.violations:
                        violations.append({
                            "id": v.id,
                            "page_id": page_id,
                            "type": v.type,
                            "details": {
                                "word": v.word,
                                "normal_form": v.normal_form,
                                "text_context": v.text_context,
                                **(v.details or {}),
                            },
                        })
                    if violations:
                        await client.table("violations").insert(violations).execute()
            except Exception as e:
                logger.error("Scan %s: error processing page %s: %s", scan_id, current_url, e)

        await browser.close()

async def _fetch_with_httpx(url: str) -> str:
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
    async with httpx.AsyncClient(headers=headers, follow_redirects=True, timeout=30.0, verify=False) as client:
        try:
            resp = await client.get(url)
            if resp.status_code >= 400: return ""
            content = resp.content
            text = ""
            for enc in [resp.encoding, "utf-8", "cp1251", "latin-1"]:
                if not enc: continue
                try:
                    candidate = content.decode(enc)
                    if candidate.count('\ufffd') < 5:
                        text = candidate
                        break
                except: continue
            if not text: text = content.decode("utf-8", errors="ignore")
            text = re.sub(r'<(script|style)[^>]*>.*?</\1>', ' ', text, flags=re.DOTALL | re.IGNORECASE)
            text = re.sub(r'<[^>]+>', ' ', text)
            return re.sub(r'\s+', ' ', text).strip()
        except:
            return ""
