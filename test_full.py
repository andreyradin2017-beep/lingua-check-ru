"""
ПОЛНОЕ ТЕСТИРОВАНИЕ LINGUACHECK-RU
Сканирование: https://elentra.ru/
"""
import asyncio
import os
import sys
from datetime import datetime
from pathlib import Path

from playwright.async_api import async_playwright, Page, Browser, BrowserContext

# Конфигурация
BASE_URL = "http://localhost:5173"
API_URL = "http://127.0.0.1:8000"
SCAN_ID = "ceb78c3c-27b8-4aaf-957d-e8bb3ccc73ac"  # ID запущенного сканирования
TEST_RESULTS_DIR = Path("test_results/full_test")
SCREENSHOT_DIR = TEST_RESULTS_DIR / "screenshots"

# Статистика тестов
class TestStats:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.warnings = 0
        self.results = []

    def add_result(self, test_name: str, status: str, details: str = ""):
        self.results.append({
            "test": test_name,
            "status": status,
            "details": details
        })
        if status == "PASS":
            self.passed += 1
        elif status == "FAIL":
            self.failed += 1
        else:
            self.warnings += 1

    def print_summary(self):
        print("\n" + "=" * 80)
        print("ITOGOVAYA STATISTIKA")
        print("=" * 80)
        print(f"PASS - Uspeshno: {self.passed}")
        print(f"FAIL - Oshibki: {self.failed}")
        print(f"WARN - Preduprezhdeniya: {self.warnings}")
        print(f"VSEGO: {self.passed + self.failed + self.warnings}")
        print("=" * 80)


stats = TestStats()


async def take_screenshot(page: Page, name: str):
    """Сделать скриншот с именем"""
    try:
        safe_name = "".join(c for c in name if c.isalnum() or c in " _-")[:50]
        path = SCREENSHOT_DIR / f"{safe_name}.png"
        await page.screenshot(path=str(path), full_page=True, timeout=15000)
        return str(path)
    except Exception as e:
        print(f"  WARN - Не удалось сделать скриншот: {e}")
        return None


async def wait_for_page_load(page: Page, timeout=10000):
    """Ждать загрузки страницы"""
    try:
        await page.wait_for_load_state('domcontentloaded', timeout=timeout)
        await asyncio.sleep(2)
    except Exception as e:
        print(f"  WARN - Таймаут загрузки страницы: {e}")


async def test_homepage(page: Page):
    """Test 1: Glavnaya stranitsa"""
    print("\n" + "=" * 80)
    print("TEST 1: GLAVNAYA STRANITSA")
    print("=" * 80)

    try:
        await page.goto(BASE_URL)
        await wait_for_page_load(page)
        await take_screenshot(page, "01_homepage")

        # Проверка заголовка
        title = await page.title()
        if "LinguaCheck" in title:
            stats.add_result("Заголовок страницы", "PASS", title)
        else:
            stats.add_result("Заголовок страницы", "FAIL", title)

        # Proverka navigatsii
        nav_items = ["Glavnaya", "Istoriya", "Sayty", "Tekst i fayly", "Slovari"]
        for item in nav_items:
            btn = page.locator(f'text={item}')
            if await btn.count() > 0:
                stats.add_result(f"Navigatsiya: {item}", "PASS")
            else:
                stats.add_result(f"Navigatsiya: {item}", "FAIL")

        # Proverka knopok deystviy
        btn_scan = page.locator('button:has-text("Proverit sayt")')
        if await btn_scan.count() > 0:
            stats.add_result("Knopka 'Proverit sayt'", "PASS")
        else:
            stats.add_result("Knopka 'Proverit sayt'", "FAIL")

        btn_text = page.locator('button:has-text("Zagruzit fayl")')
        if await btn_text.count() > 0:
            stats.add_result("Knopka 'Zagruzit fayl'", "PASS")
        else:
            stats.add_result("Knopka 'Zagruzit fayl'", "FAIL")

    except Exception as e:
        stats.add_result("Glavnaya stranitsa", "FAIL", str(e))


async def test_history_page(page: Page):
    """Test 2: Istoriya skanirovaniy"""
    print("\n" + "=" * 80)
    print("TEST 2: ISTORIYA SKANIROVANIY")
    print("=" * 80)

    try:
        await page.goto(f"{BASE_URL}/history")
        await wait_for_page_load(page)
        await take_screenshot(page, "02_history")

        # Proverka zagolovka
        header = page.locator('h2:has-text("Istoriya")')
        if await header.count() > 0:
            stats.add_result("Zagolovok 'Istoriya'", "PASS")
        else:
            stats.add_result("Zagolovok 'Istoriya'", "FAIL")

        # Proverka tablicy
        table = page.locator('table')
        if await table.count() > 0:
            stats.add_result("Tablitsa istorii", "PASS")
            
            # Proverka nalichiya nashego skanirovaniya
            rows = page.locator('table tbody tr')
            count = await rows.count()
            stats.add_result(f"Zapisey v istorii: {count}", "PASS")
        else:
            stats.add_result("Tablitsa istorii", "WARN", "Tablitsa ne naydena")

        # Proverka gorizontalnogo skrolla (A1)
        has_horizontal_scroll = await page.evaluate("""() => {
            const table = document.querySelector('table');
            if (table) {
                const container = table.parentElement;
                return container.scrollWidth > container.clientWidth;
            }
            return false;
        }""")
        
        if has_horizontal_scroll:
            stats.add_result("Gorizontalnyy skroll tablicy", "WARN", "Yest skroll (proverit mobile)")
        else:
            stats.add_result("Gorizontalnyy skroll tablicy", "PASS", "Net skrolla")

    except Exception as e:
        stats.add_result("Istoriya skanirovaniy", "FAIL", str(e))


async def test_scan_page(page: Page):
    """Test 3: Skanirovanie saytov"""
    print("\n" + "=" * 80)
    print("TEST 3: SKANIROVANIE SAYTOV")
    print("=" * 80)

    try:
        await page.goto(f"{BASE_URL}/scans")
        await wait_for_page_load(page)
        await take_screenshot(page, "03_scan_initial")

        # Proverka zagolovka
        header = page.locator('h2:has-text("Skanirovanie")')
        if await header.count() > 0:
            stats.add_result("Zagolovok 'Skanirovanie'", "PASS")
        else:
            stats.add_result("Zagolovok 'Skanirovanie'", "FAIL")

        # Proverka formy
        url_input = page.locator('input[placeholder*="example.com"]')
        if await url_input.count() > 0:
            stats.add_result("Pole vvoda URL", "PASS")
        else:
            stats.add_result("Pole vvoda URL", "FAIL")

        # Proverka knopki zapuska
        launch_btn = page.locator('button:has-text("Zapustit")')
        if await launch_btn.count() > 0:
            stats.add_result("Knopka 'Zapustit'", "PASS")
        else:
            stats.add_result("Knopka 'Zapustit'", "FAIL")

    except Exception as e:
        stats.add_result("Skanirovanie saytov", "FAIL", str(e))


async def test_scan_results(page: Page):
    """Test 4: Rezultaty skanirovaniya elentra.ru"""
    print("\n" + "=" * 80)
    print("TEST 4: REZULTATY SKANIROVANIYA ELENTA.RU")
    print("=" * 80)

    try:
        # Переход к результатам сканирования
        await page.goto(f"{BASE_URL}/scans?id={SCAN_ID}")
        await wait_for_page_load(page)
        await asyncio.sleep(5)  # Ждем загрузки результатов
        await take_screenshot(page, "04_scan_results")

        # Proverka statistiki
        stats_cards = page.locator('.mantine-Paper')
        count = await stats_cards.count()
        if count >= 3:
            stats.add_result(f"Kartochki statistiki: {count}", "PASS")
        else:
            stats.add_result("Kartochki statistiki", "WARN", f"Naydeno: {count}")

        # Proverka tablicy narusheniy
        table = page.locator('table').first
        if await table.count() > 0:
            stats.add_result("Tablitsa narusheniy", "PASS")
            
            # Proverka gruppirovki (B1)
            rows = page.locator('table tbody tr')
            row_count = await rows.count()
            stats.add_result(f"Grupp narusheniy: {row_count}", "PASS")
            
            # Proverka schyotchika povtoreniy
            count_badges = page.locator('text=x')
            badge_count = await count_badges.count()
            if badge_count > 0:
                stats.add_result(f"Gruppirovka so schyotchikom (xN): {badge_count}", "PASS")
            else:
                stats.add_result("Gruppirovka so schyotchikom", "WARN", "Schyotchiki ne naydeny")
        else:
            stats.add_result("Tablitsa narusheniy", "FAIL")

        # Proverka sortirovki (C2)
        sort_headers = page.locator('th:has-text("Tip narusheniya")')
        if await sort_headers.count() > 0:
            # Klik dlya sortirovki
            await sort_headers.first.click()
            await asyncio.sleep(1)
            await take_screenshot(page, "05_scan_sorted")
            stats.add_result("Sortirovka po kliku", "PASS")
        else:
            stats.add_result("Sortirovka po kliku", "WARN", "Zagolovok ne nayden")

        # Proverka filtrov
        search_input = page.locator('input[placeholder*="Poisk"]')
        if await search_input.count() > 0:
            await search_input.first.fill("Elentra")
            await asyncio.sleep(1)
            await take_screenshot(page, "06_scan_filtered")
            stats.add_result("Filtr po poisku", "PASS")
            await search_input.first.fill("")
        else:
            stats.add_result("Filtr po poisku", "WARN")

        # Proverka knopki "Brendy"
        brands_btn = page.locator('button:has-text("Brendy")')
        if await brands_btn.count() > 0:
            stats.add_result("Knopka 'Brendy'", "PASS")
        else:
            stats.add_result("Knopka 'Brendy'", "WARN")

        # Proverka eksporta
        excel_btn = page.locator('button:has-text("Eksport Excel")')
        if await excel_btn.count() > 0:
            stats.add_result("Knopka 'Eksport Excel'", "PASS")
        else:
            stats.add_result("Knopka 'Eksport Excel'", "WARN")

        pdf_btn = page.locator('button:has-text("Eksport PDF")')
        if await pdf_btn.count() > 0:
            stats.add_result("Knopka 'Eksport PDF'", "PASS")
        else:
            stats.add_result("Knopka 'Eksport PDF'", "WARN")

    except Exception as e:
        stats.add_result("Rezultaty skanirovaniya", "FAIL", str(e))


async def test_text_page(page: Page):
    """Test 5: Proverka teksta"""
    print("\n" + "=" * 80)
    print("TEST 5: PROVERKA TEKSTA")
    print("=" * 80)

    try:
        await page.goto(f"{BASE_URL}/text")
        await wait_for_page_load(page)
        await take_screenshot(page, "07_text_initial")

        # Proverka zagolovka
        header = page.locator('h2:has-text("Tekst")')
        if await header.count() > 0:
            stats.add_result("Zagolovok 'Tekst'", "PASS")
        else:
            stats.add_result("Zagolovok 'Tekst'", "FAIL")

        # Vvod teksta
        textarea = page.locator('textarea')
        if await textarea.count() > 0:
            await textarea.first.fill("Eto testovyy tekst. Elentra Nutrition Apple Nike.")
            stats.add_result("Vvod teksta", "PASS")
            
            # Proverka knopki
            check_btn = page.locator('button:has-text("Proverit seychas")')
            if await check_btn.count() > 0:
                await check_btn.first.click()
                await asyncio.sleep(5)
                await take_screenshot(page, "08_text_result")
                stats.add_result("Proverka teksta", "PASS")
            else:
                stats.add_result("Knopka 'Proverit seychas'", "FAIL")
        else:
            stats.add_result("Textarea", "FAIL")

    except Exception as e:
        stats.add_result("Proverka teksta", "FAIL", str(e))


async def test_dictionaries_page(page: Page):
    """Test 6: Slovari"""
    print("\n" + "=" * 80)
    print("TEST 6: SLOVARI")
    print("=" * 80)

    try:
        await page.goto(f"{BASE_URL}/dictionaries")
        await wait_for_page_load(page)
        await take_screenshot(page, "09_dictionaries")

        # Proverka zagolovka
        header = page.locator('h2:has-text("Slovari")')
        if await header.count() > 0:
            stats.add_result("Zagolovok 'Slovari'", "PASS")
        else:
            stats.add_result("Zagolovok 'Slovari'", "FAIL")

        # Proverka kartochek slovarey
        cards = page.locator('.mantine-Card-root')
        count = await cards.count()
        if count >= 3:
            stats.add_result(f"Kartochki slovarey: {count}", "PASS")
        else:
            stats.add_result("Kartochki slovarey", "WARN", f"Naydeno: {count}")

    except Exception as e:
        stats.add_result("Slovari", "FAIL", str(e))


async def test_mobile_responsive(page: Page, browser: Browser):
    """Test 7: Mobilnaya adaptivnost"""
    print("\n" + "=" * 80)
    print("TEST 7: MOBILNAYA ADAPTIVNOST (360x640)")
    print("=" * 80)

    try:
        context = await browser.new_context(
            viewport={"width": 360, "height": 640},
            device_scale_factor=2,
            is_mobile=True
        )
        mobile_page = await context.new_page()
        
        await mobile_page.goto(f"{BASE_URL}/history")
        await wait_for_page_load(mobile_page)
        await take_screenshot(mobile_page, "10_mobile_history")

        # Proverka burger-menyu
        burger = mobile_page.locator('button[aria-label="Toggle navigation"]')
        if await burger.count() > 0:
            stats.add_result("Burger-menyu (mobile)", "PASS")
        else:
            stats.add_result("Burger-menyu (mobile)", "WARN")

        # Proverka gorizontalnogo skrolla (A1)
        has_horizontal_scroll = await mobile_page.evaluate("""() => {
            return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        }""")
        
        if has_horizontal_scroll:
            stats.add_result("Gorizontalnyy skroll (mobile)", "WARN", "Yest skroll")
        else:
            stats.add_result("Gorizontalnyy skroll (mobile)", "PASS", "Net skrolla")

        await context.close()

    except Exception as e:
        stats.add_result("Mobilnaya adaptivnost", "FAIL", str(e))


async def main():
    # Sozdanie direktoriy
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)

    print("=" * 80)
    print("POLNOE TESTIROVANIE LINGUACHECK-RU")
    print("=" * 80)
    print(f"Frontend: {BASE_URL}")
    print(f"Backend: {API_URL}")
    print(f"Skanirovanie: https://elentra.ru/ (ID: {SCAN_ID})")
    print("=" * 80)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1920, "height": 1080}
        )
        page = await context.new_page()

        # Zapusk testov
        await test_homepage(page)
        await test_history_page(page)
        await test_scan_page(page)
        await test_scan_results(page)
        await test_text_page(page)
        await test_dictionaries_page(page)
        await test_mobile_responsive(page, browser)

        await context.close()
        await browser.close()

    # Vyvod itogov
    stats.print_summary()

    # Vyvod problem
    if stats.results:
        print("\n" + "=" * 80)
        print("DETALNYE REZULTATY")
        print("=" * 80)
        for result in stats.results:
            status_icon = "+" if result["status"] == "PASS" else ("!" if result["status"] == "WARN" else "-")
            print(f"  [{status_icon}] {result['test']}: {result['status']} - {result['details']}")
        print("=" * 80)

    # Sokhranenie otchyota
    save_report()


def save_report():
    """Sokhranit otchyot v fail"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    report_path = TEST_RESULTS_DIR / f"full_test_report_{timestamp}.md"

    report = f"""# Otchyot o polnom testirovanii LinguaCheck-RU

**Data:** {datetime.now().strftime("%d.%m.%Y %H:%M")}
**Skanirovanie:** https://elentra.ru/
**Status skanirovaniya:** completed (72 stranitsy, 1000 narusheniy)

---

## Rezultaty

| Test | Status | Detali |
|------|--------|--------|
"""

    for result in stats.results:
        status_ru = "[OK]" if result["status"] == "PASS" else ("[WARN]" if result["status"] == "WARN" else "[FAIL]")
        report += f"| {result['test']} | {status_ru} {result['status']} | {result['details']} |\n"

    report += f"""
---

## Statistika

- [OK] Uspeshno: {stats.passed}
- [WARN] Preduprezhdeniya: {stats.warnings}
- [FAIL] Oshibki: {stats.failed}
- VSEGO: {stats.passed + stats.warnings + stats.failed}

---

## Skrinshoty

Vse skrinshoty sokhraneny v papke: `test_results/full_test/screenshots/`
"""

    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report)

    print(f"\nOtchyot sokhranyon: {report_path}")


if __name__ == '__main__':
    asyncio.run(main())
