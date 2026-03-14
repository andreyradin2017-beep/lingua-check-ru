#!/usr/bin/env python3
"""Проверка всех страниц на проблемы верстки"""
from playwright.sync_api import sync_playwright
import time

BASE_URL = "http://127.0.0.1:5173"

pages = [
    ('/', 'home', 'Главная страница'),
    ('/scans', 'scans', 'Сканирование сайтов'),
    ('/history', 'history', 'История сканирований'),
    ('/text', 'text', 'Проверка текста'),
    ('/dictionaries', 'dictionaries', 'Словари'),
    ('/exceptions', 'exceptions', 'Исключения'),
]

print("=" * 60)
print("ПРОВЕРКА ВСЕХ СТРАНИЦ НА ПРОБЛЕМЫ ВЕРСТКИ")
print("=" * 60)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1920, 'height': 1080})
    
    results = []
    
    for url, name, title in pages:
        print(f"\n[{name}] {title}")
        print(f"URL: {BASE_URL}{url}")
        
        try:
            # Переход на страницу
            page.goto(f"{BASE_URL}{url}", wait_until='networkidle', timeout=15000)
            page.wait_for_timeout(2000)
            
            # Скриншот
            screenshot_path = f"test_screenshots/page-{name}.png"
            page.screenshot(path=screenshot_path, full_page=True)
            
            # Проверка на горизонтальный скролл
            has_horizontal_scroll = page.evaluate("""() => {
                return document.documentElement.scrollWidth > document.documentElement.clientWidth + 10;
            }""")
            
            # Проверка видимости основных элементов
            page_text = page.content()
            has_content = len(page_text) > 1000
            
            status = "[OK]" if has_content else "[WARN]"
            scroll_status = "[SCROLL]" if has_horizontal_scroll else "[OK]"
            
            print(f"  Статус: {status}")
            print(f"  Гориз. скролл: {scroll_status}")
            print(f"  Скриншот: {screenshot_path}")
            
            results.append({
                'name': name,
                'title': title,
                'url': url,
                'has_scroll': has_horizontal_scroll,
                'status': 'OK' if has_content else 'WARN'
            })
            
        except Exception as e:
            print(f"  ❌ ОШИБКА: {e}")
            results.append({
                'name': name,
                'title': title,
                'url': url,
                'has_scroll': None,
                'status': 'ERROR',
                'error': str(e)
            })
    
    browser.close()

# Итоговый отчет
print("\n" + "=" * 60)
print("ИТОГОВЫЙ ОТЧЕТ")
print("=" * 60)

for r in results:
    icon = "[OK]" if r['status'] == 'OK' else ("[!]" if r['status'] == 'WARN' else "[ERR]")
    scroll = "[SCROLL]" if r.get('has_scroll') else ""
    print(f"{icon} {r['title']:30s} {scroll}")

print("=" * 60)
print(f"Всего страниц: {len(results)}")
print(f"OK: {sum(1 for r in results if r['status'] == 'OK')}")
print(f"WARNING: {sum(1 for r in results if r['status'] == 'WARN')}")
print(f"ERROR: {sum(1 for r in results if r['status'] == 'ERROR')}")
