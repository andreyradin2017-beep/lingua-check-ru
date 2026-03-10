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

import httpx
from app.supabase_client import get_async_supabase
from app.services.token_service import analyze_text

# Установка политики для Windows (исправление NotImplementedError)
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

logger = logging.getLogger(__name__)
_ACTIVE_SCANS: dict[str, threading.Event] = {}

def _is_russian_page(text: str) -> bool:
    if not text:
        return False
    letters = re.findall(r'[a-zA-Zа-яА-ЯёЁ]', text)
    if not letters:
        return False
    cyrillic = re.findall(r'[а-яА-ЯёЁ]', text)
    ratio = len(cyrillic) / len(letters)
    return ratio > 0.10

def _run_scan_in_thread(scan_id: str, url: str, max_depth: int, max_pages: int) -> None:
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
    _ACTIVE_SCANS[scan_id] = stop_event
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
        _ACTIVE_SCANS[scan_id].set()
        logger.info("Scan %s: stop signal sent", scan_id)
        return True
    return False

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
        from datetime import datetime, timezone
        status = "completed"
        if scan_id in _ACTIVE_SCANS and _ACTIVE_SCANS[scan_id].is_set():
            status = "stopped"
        await client.table("scans").update({
            "status": status,
            "finished_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", scan_id).execute()
        logger.info("Scan %s: %s", scan_id, status)
    except Exception as exc:
        logger.exception("Scan %s: failed — %s", scan_id, exc)
        await client.table("scans").update({"status": "failed"}).eq("id", scan_id).execute()
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
        stop_event = _ACTIVE_SCANS.get(scan_id)

        while queue and pages_count < max_pages:
            if stop_event and stop_event.is_set():
                break

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
                    # Извлекаем ТОЛЬКО видимый текст пользователя (без JS/CSS)
                    # innerText игнорирует script, style и скрытые элементы
                    content_text = await page.evaluate("""() => {
                        // Получаем текст только из видимых контентных элементов
                        const selectors = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div', 'li', 'td', 'th', 'a', 'label', 'button'];
                        let text = '';
                        selectors.forEach(sel => {
                            document.querySelectorAll(sel).forEach(el => {
                                // Пропускаем элементы внутри script, style, noscript
                                if (el.closest('script, style, noscript, template')) return;
                                // Пропускаем скрытые элементы
                                const style = window.getComputedStyle(el);
                                if (style.display === 'none' || style.visibility === 'hidden') return;
                                text += ' ' + el.innerText;
                            });
                        });
                        return text;
                    }""")
                    
                    # Fallback на innerText body, если ничего не нашли
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
                    if not content_text:
                        page_status = "timeout"
                    else:
                        page_status = "ok"
                except Exception as ex:
                    logger.error("Scan %s: httpx fallback failed for %s: %s", scan_id, current_url, ex)
                    page_status = "timeout"
            finally:
                if page:
                    try:
                        await page.close()
                    except:
                        pass

            # Оборачиваем обработку страницы в try-except, чтобы ошибка на одной странице не рушила весь скан
            try:
                page_id = str(uuid.uuid4())
                page_data = {
                    "id": page_id,
                    "scan_id": scan_id,
                    "url": current_url,
                    "depth": depth,
                    "status": page_status,
                    "content_hash": hashlib.md5(content_text.encode(errors='ignore')).hexdigest(),
                }
                await client.table("pages").insert(page_data).execute()
                pages_count += 1

                if content_text and page_status == "ok" and _is_russian_page(content_text):
                    result = await analyze_text(content_text)
                    violations_to_insert = []
                    for v_schema in result.violations:
                        violations_to_insert.append({
                            "id": v_schema.id,
                            "page_id": page_id,
                            "type": v_schema.type,
                            "details": {
                                "word": v_schema.word,
                                "normal_form": v_schema.normal_form,
                                "text_context": v_schema.text_context,
                                **(v_schema.details or {}),
                            },
                        })
                    if violations_to_insert:
                        await client.table("violations").insert(violations_to_insert).execute()
            except Exception as e:
                logger.error("Scan %s: error processing page %s: %s", scan_id, current_url, e)

        await browser.close()
        logger.info("Scan %s: browser closed", scan_id)

async def _fetch_with_httpx(url: str) -> str:
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Encoding": "gzip, deflate, br"
    }
    async with httpx.AsyncClient(headers=headers, follow_redirects=True, timeout=30.0, verify=False) as client:
        try:
            resp = await client.get(url)
            if resp.status_code >= 400: return ""
            
            content = resp.content
            text = ""
            
            # 1. Пробуем декодировать на основе заголовков/автодетекта
            # Но если там UTF-8, а мы видим replacement chars — попробуем другие
            encodings = [resp.encoding, "utf-8", "cp1251", "latin-1"]
            for enc in encodings:
                if not enc: continue
                try:
                    candidate = content.decode(enc)
                    # Эвристика: если в тексте слишком много спецсимволов  — кодировка не та
                    if candidate.count('\ufffd') < 5:
                        text = candidate
                        break
                except UnicodeDecodeError:
                    continue
            
            if not text:
                text = content.decode("utf-8", errors="ignore")

            import html
            text = html.unescape(text)
            # Удаляем скрипты, стили и лишние пробелы
            text = re.sub(r'<(script|style)[^>]*>.*?</\1>', ' ', text, flags=re.DOTALL | re.IGNORECASE)
            text = re.sub(r'<[^>]+>', ' ', text)
            text = re.sub(r'\s+', ' ', text).strip()
            return text
        except Exception as e:
            logger.error("Httpx fetch failed for %s: %s", url, e)
            return ""
