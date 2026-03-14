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
from typing import Optional

import httpx
from app.supabase_client import get_async_supabase
from app.services.token_service import analyze_text
from app.config import settings

logger = logging.getLogger(__name__)

# Установка политики для Windows (исправление NotImplementedError)
# FIX #4: Правильная обработка ошибок при установке политики
if sys.platform == "win32":
    try:
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
        logger.info("Windows ProactorEventLoopPolicy установлен для корректной работы Playwright")
    except AttributeError as e:
        # Fallback если Proactor недоступен - используем политику по умолчанию
        logger.warning(
            "WindowsProactorEventLoopPolicy недоступен: %s. "
            "Используется политика по умолчанию. Playwright может работать нестабильно.",
            e
        )

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

async def _get_urls_from_sitemap(start_url: str) -> list[str]:
    """
    Пытается найти и распарсить sitemap.xml для сайта.
    """
    parsed_start = urlparse(start_url)
    base_url = f"{parsed_start.scheme}://{parsed_start.netloc}"
    sitemap_urls = []
    
    # 1. Проверяем robots.txt
    try:
        async with httpx.AsyncClient(timeout=10.0, verify=False) as client:
            resp = await client.get(f"{base_url}/robots.txt")
            if resp.status_code == 200:
                sitemap_links = re.findall(r"Sitemap:\s*(https?://[^\s]+)", resp.text, re.IGNORECASE)
                sitemap_urls.extend(sitemap_links)
    except Exception as e:
        logger.debug(f"Error checking robots.txt for {base_url}: {e}")

    # 2. Добавляем стандартный путь если ничего не нашли
    if not sitemap_urls:
        sitemap_urls.append(f"{base_url}/sitemap.xml")

    all_pages = set()
    from bs4 import BeautifulSoup

    async with httpx.AsyncClient(timeout=20.0, verify=False) as client:
        for s_url in sitemap_urls:
            try:
                resp = await client.get(s_url)
                if resp.status_code == 200:
                    soup = BeautifulSoup(resp.content, "xml")
                    # Обработка sitemap index (если внутри другие ситмапы)
                    sub_sitemaps = [loc.text for loc in soup.find_all("sitemap")]
                    if sub_sitemaps:
                        for sub in sub_sitemaps:
                            sub_resp = await client.get(sub)
                            if sub_resp.status_code == 200:
                                sub_soup = BeautifulSoup(sub_resp.content, "xml")
                                all_pages.update([loc.text for loc in sub_soup.find_all("loc")])
                    else:
                        all_pages.update([loc.text for loc in soup.find_all("loc")])
            except Exception as e:
                logger.debug(f"Error parsing sitemap {s_url}: {e}")

    # Фильтруем только страницы этого же домена
    result = [url for url in all_pages if urlparse(url).netloc == parsed_start.netloc]
    return list(set(result))

async def _scrape_site(scan_id: str, start_url: str, max_depth: int, max_pages: int, client: any) -> None:
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        logger.error("Playwright не установлен.")
        return

    base_domain = urlparse(start_url).netloc
    visited: set[str] = set()
    queue: list[tuple[str, int]] = []
    pages_count = 0
    stop_event = _ACTIVE_SCANS.get(scan_id, {}).get("stop_event")

    # 1. Попытка получить URL из Sitemap (только если глубина > 0)
    if max_depth > 0:
        sitemap_urls = await _get_urls_from_sitemap(start_url)
        if sitemap_urls:
            logger.info(f"Scan {scan_id}: found {len(sitemap_urls)} URLs in sitemap")
            # Добавляем в очередь с глубиной 0 (так как мы получили их напрямую)
            # Но при этом ограничиваем общее количество
            for url in sitemap_urls[:max_pages]:
                queue.append((url, 0))
    else:
        logger.info(f"Scan {scan_id}: depth 0, skipping sitemap and link extraction")
    
    # Если ситмап пуст или его нет, или глубина 0 - используем только старт
    if not queue:
        queue.append((start_url, 0))
    elif max_depth == 0:
        # Если вдруг в очереди что-то есть, но глубина 0 - оставляем только старт
        queue = [(start_url, 0)]
    
    # Перемешиваем или сортируем очередь, чтобы старт был первым если он есть
    if start_url in [q[0] for q in queue]:
        # Ставим старт в начало
        queue = [(start_url, 0)] + [q for q in queue if q[0] != start_url]

    async with async_playwright() as pw:
        try:
            browser = await pw.chromium.launch(
                headless=settings.playwright_headless,
                args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"]
            )
            logger.info("Scan %s: browser launched", scan_id)
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                ignore_https_errors=True,
            )
        except Exception as e:
            logger.error("Scan %s: failed to launch browser: %s", scan_id, e)
            raise
        semaphore = asyncio.Semaphore(5)
        
        async def process_page(current_url, depth):
            nonlocal pages_count
            if stop_event and stop_event.is_set():
                return
            if pages_count >= max_pages:
                return

            async with semaphore:
                if current_url in visited:
                    # Мы уже добавили в visited в основном цикле, 
                    # но тут можем проверить еще раз для надежности 
                    # или если логика входа в process_page изменится.
                    pass
                
                # visited.add(current_url) уже сделано в главном цикле
                
                page_status = "ok"
                content_text = ""
                page = None
                
                try:
                    page = await context.new_page()
                    response = await page.goto(
                        current_url,
                        timeout=settings.playwright_timeout_ms,
                        wait_until=settings.playwright_wait_until
                    )
                    if not response or response.status >= 400:
                        page_status = "blocked"
                    else:
                        await asyncio.sleep(0.5) # Немного подождем динамику
                        content_text = await page.evaluate("""() => {
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
                        }""")
                        
                        if not content_text or len(content_text.strip()) < 10:
                            content_text = await page.inner_text("body")
                        
                        if depth < max_depth:
                            links = await page.evaluate("() => Array.from(document.querySelectorAll('a[href]')).map(a => a.href).filter(h => h.startsWith('http'))")
                            for link in set(links):
                                link = link.split('#')[0].rstrip('/')
                                if link not in visited and urlparse(link).netloc == base_domain:
                                    if link not in [q[0] for q in queue]:
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

                # Сохраняем результат
                if pages_count < max_pages:
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
                        if scan_id in _ACTIVE_SCANS:
                            _ACTIVE_SCANS[scan_id]["processed_count"] = pages_count

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
                        logger.error("Scan %s: error saving page %s: %s", scan_id, current_url, e)

        
        pending_tasks = set()
        while (queue or pending_tasks) and pages_count < max_pages:
            if stop_event and stop_event.is_set():
                break
            
            # Добавляем новые задачи если есть место в очереди и лимит страниц не достигнут
            while queue and len(pending_tasks) < 5 and pages_count + len(pending_tasks) < max_pages:
                curr_url, curr_depth = queue.pop(0)
                if curr_url not in visited:
                    visited.add(curr_url)
                    task = asyncio.create_task(process_page(curr_url, curr_depth))
                    pending_tasks.add(task)
            
            if not pending_tasks:
                break
                
            # Ждем завершения хотя бы одной задачи
            done, pending_tasks = await asyncio.wait(pending_tasks, return_when=asyncio.FIRST_COMPLETED)
            
            # Обновляем инфо об очереди для UI
            if scan_id in _ACTIVE_SCANS:
                _ACTIVE_SCANS[scan_id]["queue_size"] = len(queue) + len(pending_tasks)

        # Дочищаем оставшиеся задачи
        if pending_tasks:
            await asyncio.gather(*pending_tasks, return_exceptions=True)

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
