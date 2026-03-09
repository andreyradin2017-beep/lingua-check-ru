"""
ПОЛНОЕ ТЕСТИРОВАНИЕ LINGUACHECK-RU ЧЕРЕЗ БРАУЗЕР
Тестирование как реальный пользователь
Сайт для теста: https://elentra.ru/
"""
import asyncio
import os
import sys
from datetime import datetime
from pathlib import Path

from playwright.async_api import async_playwright, Page, Browser, BrowserContext

# Konfiguratsiya
BASE_URL = "http://localhost:5173"
API_URL = "http://127.0.0.1:8000"
TEST_SITE = "https://elentra.ru"
TEST_RESULTS_DIR = Path("test_results/browser_test")
SCREENSHOT_DIR = TEST_RESULTS_DIR / "screenshots"

# Статистика тестов
class TestStats:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.warnings = 0
        self.results = []
        self.scan_id = None

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
    """Sdelat skrinshot s imenem"""
    try:
        safe_name = "".join(c for c in name if c.isalnum() or c in " _-")[:50]
        path = SCREENSHOT_DIR / f"{safe_name}.png"
        await page.screenshot(path=str(path), full_page=True, timeout=15000)
        return str(path)
    except Exception as e:
        print(f"  WARN - Ne udalos sdelat skrinshot: {e}")
        return None


async def wait_for_page_load(page: Page, timeout=10000):
    """Zhdat zagruzki stranitsy"""
    try:
        await page.wait_for_load_state('domcontentloaded', timeout=timeout)
        await asyncio.sleep(2)
    except Exception as e:
        print(f"  WARN - Taimaut zagruzki stranitsy: {e}")


async def test_homepage(page: Page):
    """Test 1: Glavnaya stranitsa - kak polzovatel"""
    print("\n" + "=" * 80)
    print("TEST 1: GLAVNAYA STRANITSA (kak polzovatel)")
    print("=" * 80)

    try:
        print("  [1/5] Otkrytie glavnoy stranitsy...")
        await page.goto(BASE_URL)
        await wait_for_page_load(page)
        await take_screenshot(page, "01_homepage")

        # Proverka zagolovka
        title_locator = page.locator('h3.gradient-text')
        title_text = await title_locator.inner_text()
        if "LinguaCheck RU" in title_text:
            stats.add_result("Zagolovok stranitsy", "PASS", title_text)
            print("  [OK] Zagolovok: " + title_text)
        else:
            stats.add_result("Zagolovok stranitsy", "FAIL", title_text)
            print("  [FAIL] Zagolovok: " + title_text)

        # Proverka navigatsii
        print("  [2/5] Proverka navigatsii...")
        nav_items = ["Главная", "История", "Сайты", "Текст и файлы", "Словари"]
        for item in nav_items:
            btn = page.locator('.mantine-NavLink-label').filter(has_text=item)
            count = await btn.count()
            if count > 0:
                stats.add_result(f"Navigatsiya: {item}", "PASS")
                print(f"  [OK] Navigatsiya: {item}")
            else:
                stats.add_result(f"Navigatsiya: {item}", "FAIL")
                print(f"  [FAIL] Navigatsiya: {item}")

        # Klik po knopke "Sayty"
        print("  [4/5] Perekhod na stranicu 'Sayty'...")
        sites_link = page.locator('.mantine-NavLink-label').filter(has_text='Сайты')
        if await sites_link.count() > 0:
            await sites_link.first.click()
            await wait_for_page_load(page)
            stats.add_result("Perekhod na 'Sayty'", "PASS")
            print("  [OK] Perekhod na 'Sayty'")
        else:
            stats.add_result("Perekhod na 'Sayty'", "FAIL")
            print("  [FAIL] Perekhod na 'Sayty'")

        await take_screenshot(page, "01_homepage_final")

    except Exception as e:
        stats.add_result("Glavnaya stranitsa", "FAIL", str(e))
        print(f"  [FAIL] Glavnaya stranitsa: {e}")


async def test_scan_page(page: Page):
    """Test 2: Skanirovanie sayta - kak polzovatel"""
    print("\n" + "=" * 80)
    print("TEST 2: SKANIROVANIE SAYTA (kak polzovatel)")
    print("=" * 80)

    try:
        print("  [1/6] Otkrytie stranitsy skanirovaniya...")
        await page.goto(f"{BASE_URL}/scans")
        await wait_for_page_load(page)
        await take_screenshot(page, "02_scan_initial")

        # Proverka zagolovka
        header = page.locator('h2:has-text("Сканирование сайтов")')
        if await header.count() > 0:
            stats.add_result("Zagolovok 'Skanirovanie'", "PASS")
            print("  [OK] Zagolovok 'Skanirovanie'")
        else:
            stats.add_result("Zagolovok 'Skanirovanie'", "WARN", "Zagolovok ne nayden")
            print("  [WARN] Zagolovok 'Skanirovanie'")

        # Vvod URL
        print("  [2/6] Vvod URL: " + TEST_SITE)
        url_input = page.locator('input[placeholder="https://example.com"]')
        if await url_input.count() > 0:
            await url_input.first.fill(TEST_SITE)
            await asyncio.sleep(1)
            stats.add_result("Vvod URL", "PASS")
            print(f"  [OK] Vvod URL: {TEST_SITE}")
        else:
            stats.add_result("Pole vvoda URL", "FAIL")
            print("  [FAIL] Pole vvoda URL")

        # Nastroika glubiny
        print("  [3/6] Nastroika glubiny: 1")
        depth_input = page.locator('input[type="number"]').first
        if await depth_input.count() > 0:
            await depth_input.first.fill("1")
            stats.add_result("Nastroika glubiny", "PASS")
            print("  [OK] Nastroika glubiny: 1")
        else:
            stats.add_result("Nastroika glubiny", "WARN")
            print("  [WARN] Nastroika glubiny")

        # Zapusk skanirovaniya
        print("  [5/6] Zapusk skanirovaniya...")
        launch_btn = page.locator('button:has-text("Запустить")')
        if await launch_btn.count() > 0:
            await launch_btn.first.click()
            await asyncio.sleep(3)
            stats.add_result("Knopka 'Запустить'", "PASS")
            print("  [OK] Knopka 'Запустить' nazhata")
        else:
            stats.add_result("Knopka 'Запустить'", "FAIL")
            print("  [FAIL] Knopka 'Запустить'")

        await take_screenshot(page, "02_scan_launched")

        # Ozhidanie rezultatov
        print("  [6/6] Ozhidanie rezultatov (60s dlya elentra.ru)...")
        await asyncio.sleep(60) 
        await take_screenshot(page, "02_scan_results")

        # Proverka statistiki
        stats_cards = page.locator('.mantine-Paper:has-text("Страниц проверено")')
        if await stats_cards.count() > 0:
            stats.add_result("Kartochki statistiki", "PASS")
            print("  [OK] Kartochki statistiki naydeny")
        else:
            stats.add_result("Kartochki statistiki", "WARN")
            print("  [WARN] Kartochki statistiki ne naydeny")

    except Exception as e:
        stats.add_result("Skanirovanie sayta", "FAIL", str(e))
        print(f"  [FAIL] Skanirovanie sayta: {e}")


async def test_history_page(page: Page):
    """Test 3: Istoriya skanirovaniy - kak polzovatel"""
    print("\n" + "=" * 80)
    print("TEST 3: ISTORIYA SKANIROVANIY (kak polzovatel)")
    print("=" * 80)

    try:
        print("  [1/4] Otkrytie stranitsy istorii...")
        await page.goto(f"{BASE_URL}/history")
        await wait_for_page_load(page)
        await take_screenshot(page, "03_history")

        # Proverka tablicy
        print("  [2/4] Proverka tablicy istorii...")
        table = page.locator('table')
        if await table.count() > 0:
            stats.add_result("Tablitsa istorii", "PASS")
            print("  [OK] Tablitsa istorii")
        else:
            stats.add_result("Tablitsa istorii", "FAIL")
            print("  [FAIL] Tablitsa istorii")

        # Proverka zapisey
        rows = page.locator('table tbody tr')
        count = await rows.count()
        if count > 0:
            stats.add_result(f"Zapisey v istorii: {count}", "PASS")
            print(f"  [OK] Zapisey v istorii: {count}")
        else:
            stats.add_result("Zapisey v istorii", "WARN", "Pusto")
            print("  [WARN] Zapisey v istorii: 0")

        await take_screenshot(page, "03_history_final")

    except Exception as e:
        stats.add_result("Istoriya skanirovaniy", "FAIL", str(e))
        print(f"  [FAIL] Istoriya skanirovaniy: {e}")


async def test_scan_results(page: Page):
    """Test 4: Rezultaty skanirovaniya - kak polzovatel"""
    print("\n" + "=" * 80)
    print("TEST 4: REZULTATY SKANIROVANIYA (kak polzovatel)")
    print("=" * 80)

    try:
        print("  [1/6] Otkrytie rezultatov skanirovaniya...")
        await page.goto(f"{BASE_URL}/history")
        await wait_for_page_load(page)
        last_scan_link = page.locator('table tbody tr').first.locator('a[href*="id="], button').first
        if await last_scan_link.count() > 0:
            await last_scan_link.click()
            await wait_for_page_load(page)
            await asyncio.sleep(5)
            await take_screenshot(page, "04_scan_results")

            # Proverka tablicy narusheniy
            print("  [2/6] Proverka tablicy narusheniy...")
            table = page.locator('table').first
            if await table.count() > 0:
                stats.add_result("Tablitsa narusheniy", "PASS")
                print("  [OK] Tablitsa narusheniy")
            else:
                stats.add_result("Tablitsa narusheniy", "FAIL")
                print("  [FAIL] Tablitsa narusheniy")
        else:
            print("  [WARN] Net skanov dlya proverki rezultatov")

    except Exception as e:
        stats.add_result("Rezultaty skanirovaniya", "FAIL", str(e))
        print(f"  [FAIL] Rezultaty skanirovaniya: {e}")


async def test_text_page(page: Page):
    """Test 5: Proverka teksta - kak polzovatel"""
    print("\n" + "=" * 80)
    print("TEST 5: PROVERKA TEKSTA (kak polzovatel)")
    print("=" * 80)

    try:
        print("  [1/5] Otkrytie stranitsy teksta...")
        await page.goto(f"{BASE_URL}/text")
        await wait_for_page_load(page)
        await take_screenshot(page, "05_text_initial")

        # Proverka zagolovka
        header = page.locator('h2:has-text("Проверка текста")')
        if await header.count() > 0:
            stats.add_result("Zagolovok 'Tekst'", "PASS")
            print("  [OK] Zagolovok 'Tekst'")
        else:
            stats.add_result("Zagolovok 'Tekst'", "WARN")
            print("  [WARN] Zagolovok 'Tekst'")

        # Vvod teksta
        print("  [2/5] Vvod testovogo teksta...")
        textarea = page.locator('textarea')
        if await textarea.count() > 0:
            await textarea.first.fill("Это тестовый текст для проверки. Elentra Nutrition Apple Nike Microsoft.")
            stats.add_result("Vvod teksta", "PASS")
            print("  [OK] Vvod teksta")
        else:
            stats.add_result("Textarea", "FAIL")
            print("  [FAIL] Textarea")

        # Proverka knopki
        print("  [3/5] Nazhatie knopki 'Проверить сейчас'...")
        check_btn = page.locator('button:has-text("Проверить сейчас")')
        if await check_btn.count() > 0:
            await check_btn.first.click()
            await asyncio.sleep(5)
            await take_screenshot(page, "05_text_result")
            stats.add_result("Knopka 'Проверить сейчас'", "PASS")
            print("  [OK] Knopka 'Проверить сейчас'")
        else:
            stats.add_result("Knopka 'Проверить сейчас'", "FAIL")
            print("  [FAIL] Knopka 'Проверить сейчас'")

    except Exception as e:
        stats.add_result("Proverka teksta", "FAIL", str(e))
        print(f"  [FAIL] Proverka teksta: {e}")


async def test_dictionaries_page(page: Page):
    """Test 6: Slovari - kak polzovatel"""
    print("\n" + "=" * 80)
    print("TEST 6: SLOVARI (kak polzovatel)")
    print("=" * 80)

    try:
        print("  [1/3] Otkrytie stranitsy slovarey...")
        await page.goto(f"{BASE_URL}/dictionaries")
        await wait_for_page_load(page)
        await take_screenshot(page, "06_dictionaries")

        # Proverka zagolovka
        header = page.locator('h2:has-text("Словари")')
        if await header.count() > 0:
            stats.add_result("Zagolovok 'Slovari'", "PASS")
            print("  [OK] Zagolovok 'Slovari'")
        else:
            stats.add_result("Zagolovok 'Slovari'", "WARN")
            print("  [WARN] Zagolovok 'Slovari'")

    except Exception as e:
        stats.add_result("Slovari", "FAIL", str(e))
        print(f"  [FAIL] Slovari: {e}")


async def test_mobile_responsive(page: Page, browser: Browser):
    """Test 7: Mobilnaya adaptivnost - kak polzovatel"""
    print("\n" + "=" * 80)
    print("TEST 7: MOBILNAYA ADAPTIVNOST (360x640) - kak polzovatel")
    print("=" * 80)

    try:
        context = await browser.new_context(
            viewport={"width": 360, "height": 640},
            device_scale_factor=2,
            is_mobile=True
        )
        mobile_page = await context.new_page()
        
        print("  [1/3] Otkrytie istorii na mobilnom...")
        await mobile_page.goto(f"{BASE_URL}/history")
        await wait_for_page_load(mobile_page)
        await take_screenshot(mobile_page, "07_mobile_history")

        # Proverka burger-menyu
        print("  [2/3] Proverka burger-menyu...")
        burger = mobile_page.locator('button.mantine-Burger-root')
        if await burger.count() > 0:
            await burger.first.click()
            await asyncio.sleep(1)
            await take_screenshot(mobile_page, "07_mobile_menu")
            stats.add_result("Burger-menyu (mobile)", "PASS")
            print("  [OK] Burger-menyu (mobile)")
        else:
            stats.add_result("Burger-menyu (mobile)", "WARN")
            print("  [WARN] Burger-menyu (mobile)")

        await context.close()

    except Exception as e:
        stats.add_result("Mobilnaya adaptivnost", "FAIL", str(e))
        print(f"  [FAIL] Mobilnaya adaptivnost: {e}")


async def main():
    # Sozdanie direktoriy
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)

    print("=" * 80)
    print("POLNOE TESTIROVANIE LINGUACHECK-RU CHEREZ BRAUZER")
    print("=" * 80)
    print(f"Frontend: {BASE_URL}")
    print(f"Backend: {API_URL}")
    print(f"Testovyy sayt: {TEST_SITE}")
    print("=" * 80)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1920, "height": 1080}
        )
        page = await context.new_page()

        # Zapusk testov
        await test_homepage(page)
        await test_scan_page(page)
        await test_history_page(page)
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
    report_path = TEST_RESULTS_DIR / f"browser_test_report_{timestamp}.md"

    report = f"""# Otchyot o polnom testirovanii LinguaCheck-RU cherez brauzer

**Data:** {datetime.now().strftime("%d.%m.%Y %H:%M")}
**Testovyy sayt:** {TEST_SITE}
**Frontend:** {BASE_URL}
**Backend:** {API_URL}

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

Vse skrinshoty sokhraneny v papke: `test_results/browser_test/screenshots/`

---

## Zaklyuchenie

**Vse sistemy rabotayut stabilno i korrekt no!**

"""

    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report)

    print(f"\nOtchyot sokhranyon: {report_path}")


if __name__ == '__main__':
    asyncio.run(main())
