"""
Финальная проверка всех страниц LinguaCheck RU
Запуск: python test_final_check.py
"""

import asyncio
import sys
from playwright.async_api import async_playwright

BASE_URL = "http://127.0.0.1:5173"
BACKEND_URL = "http://127.0.0.1:8000"

# Устанавливаем UTF-8 для Windows
if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')

async def check_page(page, url, name, checks):
    """Проверка страницы"""
    print(f"\n{'='*60}")
    print(f"ПРОВЕРКА: {name} ({url})")
    print('='*60)
    
    try:
        response = await page.goto(url, timeout=10000, wait_until="commit")
        await page.wait_for_load_state("domcontentloaded", timeout=5000)
        await page.wait_for_timeout(3000)  # Увеличено время для загрузки React
        
        results = []
        for check_name, selector in checks.items():
            try:
                elem = await page.query_selector(selector)
                status = "[OK]" if elem else "[ERR]"
                results.append(status)
                print(f"  {status} {check_name}")
            except Exception as e:
                results.append("[ERR]")
                print(f"  [ERR] {check_name}: {e}")
        
        passed = results.count("[OK]") / len(results) * 100
        print(f"\nРезультат: {passed:.0f}% ({results.count('[OK]')}/{len(results)})")
        return passed >= 80
        
    except Exception as e:
        print(f"[ERR] Ошибка загрузки: {e}")
        return False


async def main():
    print("="*60)
    print("ФИНАЛЬНАЯ ПРОВЕРКА LINGUACHECK RU")
    print("="*60)
    
    # Проверка backend
    print("\n[1] Проверка Backend API...")
    try:
        import urllib.request
        with urllib.request.urlopen(f"{BACKEND_URL}/api/v1/scans", timeout=5) as resp:
            if resp.status == 200:
                print("  [OK] Backend API работает")
            else:
                print(f"  [ERR] Backend API: статус {resp.status}")
    except Exception as e:
        print(f"  [ERR] Backend API: {e}")
        return
    
    # Проверка frontend
    print("\n[2] Проверка Frontend...")
    try:
        import urllib.request
        with urllib.request.urlopen(BASE_URL, timeout=5) as resp:
            if resp.status == 200:
                print("  [OK] Frontend работает")
            else:
                print(f"  [ERR] Frontend: статус {resp.status}")
    except Exception as e:
        print(f"  [ERR] Frontend: {e}")
        return
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1920, "height": 1080})
        page = await context.new_page()
        
        results = {}
        
        # Страница 1: Главная
        results["Главная"] = await check_page(page, f"{BASE_URL}/", "Главная страница", {
            "Заголовок LinguaCheck": "text=LinguaCheck",
            "Кнопка 'Проверить сайт'": "button:has-text('Проверить сайт')",
            "Карточки преимуществ": "[class*='Paper']",
        })
        
        # Страница 2: История
        results["История"] = await check_page(page, f"{BASE_URL}/history", "История сканирований", {
            "Заголовок": "h2:has-text('История'), h1:has-text('История'), [class*='Title']:has-text('История')",
            "Таблица": "table, [role='table']",
            "Записи": "tbody tr, [class*='row']",
        })
        
        # Страница 3: Сканирование
        results["Сканирование"] = await check_page(page, f"{BASE_URL}/scans", "Сканирование сайтов", {
            "Поле ввода URL": "input[type='url'], input[placeholder*='http']",
            "Кнопка 'Запустить'": "button:has-text('Запустить')",
            "Форма сканирования": "[class*='Paper']",  # Форма всегда видна
        })
        
        # Страница 4: Текст
        results["Текст"] = await check_page(page, f"{BASE_URL}/text", "Проверка текста", {
            "Вкладка 'Вставить текст'": "[role='tab']:has-text('Вставить')",
            "Textarea": "textarea",
            "Кнопка 'Проверить'": "button:has-text('Проверить')",
        })
        
        # Страница 5: Словари
        results["Словари"] = await check_page(page, f"{BASE_URL}/dictionaries", "Словари", {
            "Заголовок 'Нормативные словари'": "text=Нормативные словари",
            "Карточки словарей": "[class*='Card']",
        })
        
        # Страница 6: Исключения
        results["Исключения"] = await check_page(page, f"{BASE_URL}/exceptions", "Глобальные исключения", {
            "Заголовок 'Глобальные исключения'": "text=Глобальные исключения",
            "Поле ввода слова": "input[placeholder*='gmp']",
            "Кнопка 'Добавить'": "button:has-text('Добавить')",
        })
        
        await browser.close()
        
        # Итоги
        print("\n" + "="*60)
        print("ИТОГОВЫЙ ОТЧЁТ")
        print("="*60)
        
        for name, passed in results.items():
            status = "[OK] PASS" if passed else "[ERR] FAIL"
            print(f"{status}: {name}")
        
        total = sum(1 for v in results.values() if v)
        print(f"\nВсего: {total}/{len(results)} страниц работают корректно")
        
        if total == len(results):
            print("\n[OK] ВСЕ СТРАНИЦЫ РАБОТАЮТ!")
        else:
            print(f"\n[WARN] {len(results) - total} страниц имеют проблемы")


if __name__ == "__main__":
    asyncio.run(main())
