"""
scan_service.py — Phase 4
Управление сканами сайтов через Playwright.
На Windows uvicorn с reload=True использует SelectorEventLoop, который не поддерживает
subprocess (нужный Playwright). Решение: создаём отдельный поток с ProactorEventLoop.
"""
import asyncio
import hashlib
import logging
import sys
import threading
import re
import uuid
from urllib.parse import urljoin, urlparse

import os
import httpx
from app.supabase_client import get_async_supabase
from app.services.token_service import analyze_text
from app.services.visual_dominance_service import analyze_visual_dominance

logger = logging.getLogger(__name__)


def _is_russian_page(text: str) -> bool:
    """
    Проверяет, является ли страница русскоязычной.
    Считаем количество кириллических букв относительно всех букв.
    Если кириллицы < 10%, считаем страницу иностранной.
    """
    if not text:
        return False
    
    letters = re.findall(r'[a-zA-Zа-яА-ЯёЁ]', text)
    if not letters:
        return False
        
    cyrillic = re.findall(r'[а-яА-ЯёЁ]', text)
    ratio = len(cyrillic) / len(letters)
    
    return ratio > 0.10  # Порог 10%



def _run_scan_in_thread(scan_id: str, url: str, max_depth: int, max_pages: int, capture_screenshots: bool = True) -> None:
    """
    Запускает _run_scan в отдельном потоке с собственным ProactorEventLoop.
    Это обходит проблему Windows + uvicorn reload, где основной loop — SelectorEventLoop.
    """
    if sys.platform == "win32":
        loop = asyncio.ProactorEventLoop()
    else:
        loop = asyncio.new_event_loop()

    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(_run_scan(scan_id, url, max_depth, max_pages, capture_screenshots))
    except Exception as e:
        logger.exception("Scan thread %s failed: %s", scan_id, e)
    finally:
        loop.close()


async def start_scan_background(
    scan_id: str, url: str, max_depth: int, max_pages: int, capture_screenshots: bool = True
) -> None:
    """Запускает сканирование в отдельном потоке (ProactorEventLoop совместимый с Playwright)."""
    t = threading.Thread(
        target=_run_scan_in_thread,
        args=(scan_id, url, max_depth, max_pages, capture_screenshots),
        name=f"scan-{scan_id}",
        daemon=True,
    )
    t.start()
    logger.info("Scan %s: thread started", scan_id)


async def _run_scan(scan_id: str, url: str, max_depth: int, max_pages: int, capture_screenshots: bool = True) -> None:
    """Основной цикл сканирования."""
    logger.info("Scan %s: starting for %s", scan_id, url)

    # Создаем локальный клиент для текущего event loop
    client = await get_async_supabase()

    # Обновляем статус скана через REST
    try:
        await client.table("scans").update({"status": "in_progress"}).eq("id", scan_id).execute()
    except Exception as e:
        logger.error("Scan %s: failed to mark as in_progress: %s", scan_id, e)
        return

    try:
        await _scrape_site(scan_id, url, max_depth, max_pages, capture_screenshots, client)

        # Завершение скана
        from datetime import datetime, timezone
        await client.table("scans").update({
            "status": "completed",
            "finished_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", scan_id).execute()
        logger.info("Scan %s: completed", scan_id)
    except Exception as exc:
        logger.exception("Scan %s: failed — %s", scan_id, exc)
        await client.table("scans").update({"status": "failed"}).eq("id", scan_id).execute()


async def _scrape_site(
    scan_id: str, start_url: str, max_depth: int, max_pages: int, capture_screenshots: bool, client: any
) -> None:
    """Обход сайта через Playwright с BFS."""
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
                args=[
                    "--no-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-blink-features=AutomationControlled",
                    "--disable-extensions",
                    "--disable-gpu",
                ]
            )
            logger.info("Scan %s: browser launched", scan_id)
        except Exception as e:
            logger.error("Scan %s: failed to launch browser: %s", scan_id, e)
            raise

        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            ignore_https_errors=True,
            extra_http_headers={
                "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            },
        )

        while queue and pages_count < max_pages:
            current_url, depth = queue.pop(0)
            if current_url in visited:
                continue
            visited.add(current_url)

            if urlparse(current_url).netloc != base_domain:
                continue

            page_status = "ok"
            content_text = ""
            elements_data: list[dict] = []
            page = None

            try:
                page = await context.new_page()
                # Увеличиваем таймаут до 60с для тяжелых сайтов
                response = await page.goto(current_url, timeout=60000, wait_until="domcontentloaded")
                # Ждём загрузки DOM с коротким таймаутом (anti-bot часто задерживает DOMContentLoaded)
                try:
                    await page.wait_for_load_state("domcontentloaded", timeout=10000)
                except Exception:
                    pass  # Возьмём что успело загрузиться

                if not response or response.status >= 400:
                    page_status = "blocked"
                    logger.warning("Scan %s: blocked %s (status %s)", scan_id, current_url,
                                   response.status if response else "no response")
                else:
                    content_text = await page.inner_text("body")
                    elements_data = await _extract_elements(page)

                    # Собираем ссылки для BFS
                    if depth < max_depth:
                        try:
                            links = await page.evaluate("""
                                () => Array.from(document.querySelectorAll('a[href]'))
                                    .map(a => a.href)
                                    .filter(h => h.startsWith('http'))
                            """)
                            for link in links:
                                link = link.split('#')[0]
                                ext = link.split('.')[-1].lower() if '.' in link else ''
                                if ext in ('pdf', 'jpg', 'jpeg', 'png', 'gif', 'svg', 'zip', 'doc', 'docx', 'xls', 'xlsx'):
                                    continue
                                if link not in visited and urlparse(link).netloc == base_domain:
                                    queue.append((link, depth + 1))
                        except Exception as e:
                            logger.warning("Scan %s: links extract error: %s", scan_id, e)

            except Exception as e:
                logger.warning("Scan %s: Playwright error %s — %s. Trying httpx fallback...", scan_id, current_url, e)
                # Fallback: пробуем получить страницу через httpx
                try:
                    content_text = await _fetch_with_httpx(current_url)
                    if content_text:
                        page_status = "ok"
                        logger.info("Scan %s: httpx fallback success for %s", scan_id, current_url)
                    else:
                        page_status = "timeout"
                except Exception as e2:
                    logger.warning("Scan %s: httpx fallback also failed: %s", scan_id, e2)
                    page_status = "timeout"

            # Сохраняем страницу через REST API (Async)
            page_id = str(uuid.uuid4())
            content_hash = hashlib.md5(content_text.encode()).hexdigest()
            
            page_data = {
                "id": page_id,
                "scan_id": scan_id,
                "url": current_url,
                "depth": depth,
                "status": page_status,
                "content_hash": content_hash,
            }

            try:
                await client.table("pages").insert(page_data).execute()
            except Exception as e:
                logger.warning("Scan %s: failed to save page data for %s: %s", scan_id, current_url, e)

            pages_count += 1
            logger.info("Scan %s: page %d — %s [%s]", scan_id, pages_count, current_url, page_status)

            # Анализ контента
            if content_text and page_status == "ok":
                # Проверка языка (Phase 9)
                if not _is_russian_page(content_text):
                    logger.info("Scan %s: skipping non-Russian page: %s", scan_id, current_url)
                else:
                    result = await analyze_text(content_text)
                    visual_violations = await analyze_visual_dominance(elements_data)

                    # Скриншот при нарушениях
                    screenshot_url = None
                    if capture_screenshots and (result.violations or visual_violations) and page is not None:
                        try:
                            os_path = f"static/screenshots/{page_id}.png"
                            await page.screenshot(path=os_path, full_page=False)
                            screenshot_url = f"/static/screenshots/{page_id}.png"
                        except Exception as e:
                            logger.warning("Scan %s: screenshot failed: %s", scan_id, e)

                    # Сохраняем нарушения (батчем через REST Async)
                    violations_to_insert = []
                    
                    # Текстовые
                    for v_schema in result.violations:
                        details = {
                            "word": v_schema.word,
                            "normal_form": v_schema.normal_form,
                            "text_context": v_schema.text_context,
                            **(v_schema.details or {}),
                        }
                        if screenshot_url:
                            details["screenshot_path"] = screenshot_url

                        violations_to_insert.append({
                            "id": v_schema.id,
                            "page_id": page_id,
                            "type": v_schema.type,
                            "details": details,
                        })

                    # Визуальные
                    for vv in visual_violations:
                        details = vv.copy()
                        if screenshot_url:
                            details["screenshot_path"] = screenshot_url

                        violations_to_insert.append({
                            "id": str(uuid.uuid4()),
                            "page_id": page_id,
                            "type": "visual_dominance",
                            "details": details,
                        })
                    
                    if violations_to_insert:
                        # Вставляем чанками по 20, чтобы избежать таймаутов (ReadTimeout)
                        chunk_size = 20
                        for i in range(0, len(violations_to_insert), chunk_size):
                            chunk = violations_to_insert[i : i + chunk_size]
                            try:
                                await client.table("violations").insert(chunk).execute()
                                logger.info("Scan %s: inserted chunk of %d violations", scan_id, len(chunk))
                            except Exception as e:
                                logger.warning("Scan %s: violations chunk insert failed: %s", scan_id, e)

            # Закрываем страницу
            if page is not None:
                try:
                    await page.close()
                except Exception:
                    pass

        await browser.close()
        logger.info("Scan %s: browser closed", scan_id)


async def _fetch_with_httpx(url: str) -> str:
    """Запрашивает страницу через httpx как fallback для anti-bot сайтов."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8",
    }
    async with httpx.AsyncClient(headers=headers, follow_redirects=True, timeout=20.0) as client:
        resp = await client.get(url)
        if resp.status_code >= 400:
            return ""
        # Простое извлечение текста из HTML
        import re
        import html
        text = html.unescape(resp.text)
        # Убираем script/style теги
        text = re.sub(r'<script[^>]*>.*?</script>', ' ', text, flags=re.DOTALL | re.IGNORECASE)
        text = re.sub(r'<style[^>]*>.*?</style>', ' ', text, flags=re.DOTALL | re.IGNORECASE)
        # Убираем все HTML теги
        text = re.sub(r'<[^>]+>', ' ', text)
        # Нормализуем пробелы
        text = re.sub(r'\s+', ' ', text).strip()
        return text


async def _extract_elements(page) -> list[dict]:
    """
    Извлекает текстовые элементы с CSS-свойствами.
    Возвращает [{text, font_size, font_weight, color, bg_color}]
    """
    try:
        elements = await page.evaluate("""
            () => {
                const result = [];
                const walker = document.createTreeWalker(
                    document.body,
                    NodeFilter.SHOW_TEXT,
                    null,
                );
                let node;
                while ((node = walker.nextNode())) {
                    const text = node.textContent?.trim();
                    if (!text || text.length < 2) continue;
                    const el = node.parentElement;
                    if (!el) continue;
                    const cs = window.getComputedStyle(el);
                    result.push({
                        text: text.substring(0, 200),
                        font_size: parseFloat(cs.fontSize) || 16,
                        font_weight: parseInt(cs.fontWeight) || 400,
                        color: cs.color,
                        bg_color: cs.backgroundColor,
                        selector: el.tagName.toLowerCase(),
                    });
                }
                return result.slice(0, 500);
            }
        """)
        return elements or []
    except Exception as e:
        logger.warning("_extract_elements error: %s", e)
        return []
