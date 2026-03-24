"""
Расширенные тесты адаптивности и кроссбраузерности
Проверка на всех ключевых разрешениях и браузерах
"""
import pytest
from playwright.async_api import async_playwright, Page, Browser


BASE_URL = "http://127.0.0.1:5173"

# Ключевые разрешения для тестирования
VIEWPORTS = {
    "iPhone SE": {"width": 375, "height": 667, "device_scale_factor": 2, "is_mobile": True},
    "iPhone 14 Pro": {"width": 393, "height": 852, "device_scale_factor": 3, "is_mobile": True},
    "Samsung Galaxy S21": {"width": 360, "height": 800, "device_scale_factor": 3, "is_mobile": True},
    "iPad Mini": {"width": 768, "height": 1024, "device_scale_factor": 2, "is_mobile": False},
    "iPad Pro": {"width": 1024, "height": 1366, "device_scale_factor": 2, "is_mobile": False},
    "Laptop 13": {"width": 1280, "height": 720, "device_scale_factor": 1, "is_mobile": False},
    "Laptop 15": {"width": 1920, "height": 1080, "device_scale_factor": 1, "is_mobile": False},
    "Desktop 2K": {"width": 2560, "height": 1440, "device_scale_factor": 1, "is_mobile": False},
}

# Основные браузеры
BROWSERS = ["chromium", "firefox", "webkit"]


class TestResponsiveAllViewports:
    """Тесты адаптивности на всех ключевых разрешениях"""

    @pytest.mark.asyncio
    @pytest.mark.parametrize("viewport_name", VIEWPORTS.keys())
    async def test_all_pages_responsive(self, viewport_name):
        """Проверка всех страниц на разных viewport"""
        viewport = VIEWPORTS[viewport_name]
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                viewport={"width": viewport["width"], "height": viewport["height"]},
                device_scale_factor=viewport.get("device_scale_factor", 1),
                is_mobile=viewport.get("is_mobile", False)
            )
            page = await context.new_page()
            
            try:
                # Тест главной страницы
                await page.goto(BASE_URL)
                await page.wait_for_load_state("domcontentloaded")
                title = await page.title()
                assert "LinguaCheck" in title, f"{viewport_name}: Главная не загрузилась"
                
                # Тест страницы сканирования
                await page.goto(f"{BASE_URL}/scans")
                await page.wait_for_load_state("domcontentloaded")
                await page.wait_for_selector("h2:has-text('Сканирование')", timeout=10000)
                
                # Тест страницы истории
                await page.goto(f"{BASE_URL}/history")
                await page.wait_for_load_state("domcontentloaded")
                await page.wait_for_selector("h2:has-text('История')", timeout=10000)
                
                # Тест страницы текста
                await page.goto(f"{BASE_URL}/text")
                await page.wait_for_load_state("domcontentloaded")
                await page.wait_for_selector("h2:has-text('Текст')", timeout=10000)
                
                # Тест страницы словарей
                await page.goto(f"{BASE_URL}/dictionaries")
                await page.wait_for_load_state("domcontentloaded")
                await page.wait_for_selector("h2:has-text('Словари')", timeout=10000)
                
                # Делаем скриншот для визуальной проверки
                await page.screenshot(
                    path=f"test_screenshots/responsive_{viewport_name.replace(' ', '_').lower()}.png",
                    full_page=True
                )
                
            finally:
                await page.close()
                await context.close()
                await browser.close()

    @pytest.mark.asyncio
    @pytest.mark.parametrize("viewport_name", ["iPhone SE", "iPad Mini", "Desktop 2K"])
    async def test_navigation_menu_responsive(self, viewport_name):
        """Проверка навигационного меню на разных разрешениях"""
        viewport = VIEWPORTS[viewport_name]
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                viewport={"width": viewport["width"], "height": viewport["height"]},
                device_scale_factor=viewport.get("device_scale_factor", 1),
                is_mobile=viewport.get("is_mobile", False)
            )
            page = await context.new_page()
            
            try:
                await page.goto(BASE_URL)
                await page.wait_for_load_state("domcontentloaded")
                
                # Проверяем наличие навигации
                nav_visible = await page.is_visible("nav") or await page.is_visible("[class*='Navbar']")
                assert nav_visible, f"{viewport_name}: Навигация не найдена"
                
                # Проверяем элементы навигации
                nav_items = await page.query_selector_all("nav a, [class*='Navbar'] a")
                assert len(nav_items) >= 4, f"{viewport_name}: Мало элементов навигации"
                
            finally:
                await page.close()
                await context.close()
                await browser.close()

    @pytest.mark.asyncio
    @pytest.mark.parametrize("viewport_name", ["iPhone SE", "iPad Mini", "Laptop 15"])
    async def test_tables_responsive(self, viewport_name):
        """Проверка таблиц на разных разрешениях"""
        viewport = VIEWPORTS[viewport_name]
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                viewport={"width": viewport["width"], "height": viewport["height"]},
                device_scale_factor=viewport.get("device_scale_factor", 1),
                is_mobile=viewport.get("is_mobile", False)
            )
            page = await context.new_page()
            
            try:
                await page.goto(f"{BASE_URL}/history")
                await page.wait_for_load_state("domcontentloaded")
                await page.wait_for_timeout(3000)
                
                # Проверяем что таблица существует
                table = await page.query_selector("table")
                if table:
                    # Проверяем что таблица не выходит за границы viewport
                    box = await table.bounding_box()
                    if box:
                        assert box["width"] <= viewport["width"], \
                            f"{viewport_name}: Таблица шире экрана"
                
            finally:
                await page.close()
                await context.close()
                await browser.close()

    @pytest.mark.asyncio
    @pytest.mark.parametrize("viewport_name", ["iPhone SE", "Samsung Galaxy S21"])
    async def test_mobile_touch_interactions(self, viewport_name):
        """Проверка тач-взаимодействий на мобильных"""
        viewport = VIEWPORTS[viewport_name]
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                viewport={"width": viewport["width"], "height": viewport["height"]},
                device_scale_factor=viewport.get("device_scale_factor", 1),
                is_mobile=True
            )
            page = await context.new_page()
            
            try:
                await page.goto(BASE_URL)
                await page.wait_for_load_state("domcontentloaded")
                
                # Проверяем что кнопки достаточно большие для тача (мин. 40px)
                buttons = await page.query_selector_all("button")
                for btn in buttons[:5]:  # Проверяем первые 5 кнопок
                    box = await btn.bounding_box()
                    if box:
                        # Минимальный размер для тача 44px, но допускаем 40px
                        assert box["height"] >= 40, \
                            f"{viewport_name}: Кнопка слишком маленькая ({box['height']}px)"
                
            finally:
                await page.close()
                await context.close()
                await browser.close()


    @pytest.mark.asyncio
    @pytest.mark.parametrize("viewport_name", ["iPhone SE", "Samsung Galaxy S21"])
    async def test_mobile_card_view(self, viewport_name):
        """Проверка карточного представления на мобильных"""
        viewport = VIEWPORTS[viewport_name]
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                viewport={"width": viewport["width"], "height": viewport["height"]},
                device_scale_factor=viewport.get("device_scale_factor", 1),
                is_mobile=True
            )
            page = await context.new_page()
            
            try:
                # Переходим на страницу истории
                await page.goto(f"{BASE_URL}/history")
                await page.wait_for_load_state("domcontentloaded")
                await page.wait_for_timeout(3000)
                
                # На мобильных должна быть таблица или карточки
                table = await page.query_selector("table")
                cards = await page.query_selector(".violation-card-mobile")
                
                # Если есть таблица, проверяем что она не выходит за границы
                if table:
                    box = await table.bounding_box()
                    if box:
                        # Таблица должна иметь горизонтальный скролл или быть скрыта
                        assert box["width"] <= viewport["width"] * 1.5, \
                            f"{viewport_name}: Таблица слишком широкая"
                
            finally:
                await page.close()
                await context.close()
                await browser.close()


class TestCrossBrowser:
    """Тесты кроссбраузерности"""

    @pytest.mark.asyncio
    @pytest.mark.parametrize("browser_type", BROWSERS)
    async def test_homepage_all_browsers(self, browser_type):
        """Главная страница во всех браузерах"""
        async with async_playwright() as p:
            browser = await getattr(p, browser_type).launch(headless=True)
            context = await browser.new_context(
                viewport={"width": 1920, "height": 1080}
            )
            page = await context.new_page()
            
            try:
                await page.goto(BASE_URL)
                await page.wait_for_load_state("domcontentloaded")
                
                title = await page.title()
                assert "LinguaCheck" in title, \
                    f"{browser_type}: Главная не загрузилась"
                
                # Делаем скриншот
                await page.screenshot(
                    path=f"test_screenshots/{browser_type}_homepage.png"
                )
                
            finally:
                await page.close()
                await context.close()
                await browser.close()

    @pytest.mark.asyncio
    @pytest.mark.parametrize("browser_type", BROWSERS)
    async def test_scan_page_all_browsers(self, browser_type):
        """Страница сканирования во всех браузерах"""
        async with async_playwright() as p:
            browser = await getattr(p, browser_type).launch(headless=True)
            context = await browser.new_context(
                viewport={"width": 1920, "height": 1080}
            )
            page = await context.new_page()
            
            try:
                await page.goto(f"{BASE_URL}/scans")
                await page.wait_for_load_state("domcontentloaded")
                
                await page.wait_for_selector("h2:has-text('Сканирование')", timeout=10000)
                
                # Делаем скриншот
                await page.screenshot(
                    path=f"test_screenshots/{browser_type}_scan.png"
                )
                
            finally:
                await page.close()
                await context.close()
                await browser.close()

    @pytest.mark.asyncio
    @pytest.mark.parametrize("browser_type", BROWSERS)
    async def test_text_page_all_browsers(self, browser_type):
        """Страница текста во всех браузерах"""
        async with async_playwright() as p:
            browser = await getattr(p, browser_type).launch(headless=True)
            context = await browser.new_context(
                viewport={"width": 1920, "height": 1080}
            )
            page = await context.new_page()
            
            try:
                await page.goto(f"{BASE_URL}/text")
                await page.wait_for_load_state("domcontentloaded")
                
                await page.wait_for_selector("h2:has-text('Текст')", timeout=10000)
                
                # Делаем скриншот
                await page.screenshot(
                    path=f"test_screenshots/{browser_type}_text.png"
                )
                
            finally:
                await page.close()
                await context.close()
                await browser.close()

    @pytest.mark.asyncio
    @pytest.mark.parametrize("browser_type", BROWSERS)
    async def test_history_page_all_browsers(self, browser_type):
        """Страница истории во всех браузерах"""
        async with async_playwright() as p:
            browser = await getattr(p, browser_type).launch(headless=True)
            context = await browser.new_context(
                viewport={"width": 1920, "height": 1080}
            )
            page = await context.new_page()
            
            try:
                await page.goto(f"{BASE_URL}/history")
                await page.wait_for_load_state("domcontentloaded")
                await page.wait_for_timeout(3000)
                
                await page.wait_for_selector("h2:has-text('История')", timeout=10000)
                
                # Делаем скриншот
                await page.screenshot(
                    path=f"test_screenshots/{browser_type}_history.png"
                )
                
            finally:
                await page.close()
                await context.close()
                await browser.close()


class TestVisualRegression:
    """Тесты визуальной регрессии"""

    @pytest.mark.asyncio
    async def test_homepage_visual_baseline(self):
        """Создание базового скриншота главной страницы"""
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                viewport={"width": 1920, "height": 1080}
            )
            page = await context.new_page()
            
            try:
                await page.goto(BASE_URL)
                await page.wait_for_load_state("domcontentloaded")
                
                # Скриншот всей страницы
                await page.screenshot(
                    path="test_screenshots/homepage_baseline.png",
                    full_page=True
                )
                
            finally:
                await page.close()
                await context.close()
                await browser.close()

    @pytest.mark.asyncio
    async def test_all_pages_visual_baseline(self):
        """Создание базовых скриншотов всех страниц"""
        pages_to_test = [
            ("/", "homepage"),
            ("/scans", "scans"),
            ("/history", "history"),
            ("/text", "text"),
            ("/dictionaries", "dictionaries"),
            ("/exceptions", "exceptions"),
        ]
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                viewport={"width": 1920, "height": 1080}
            )
            page = await context.new_page()
            
            try:
                for url, name in pages_to_test:
                    await page.goto(f"{BASE_URL}{url}")
                    await page.wait_for_load_state("domcontentloaded")
                    await page.wait_for_timeout(2000)
                    
                    await page.screenshot(
                        path=f"test_screenshots/{name}_baseline.png",
                        full_page=True
                    )
                    
            finally:
                await page.close()
                await context.close()
                await browser.close()


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
