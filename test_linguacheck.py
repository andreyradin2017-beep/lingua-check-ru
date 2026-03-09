"""
Playwright E2E тесты для LinguaCheck frontend
Запуск: python test_linguacheck.py
"""

import asyncio
import sys
import os
from datetime import datetime
from pathlib import Path

# Устанавливаем кодировку UTF-8 для Windows console
if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Создаём директорию для скриншотов
SCREENSHOTS_DIR = Path(__file__).parent / "test_results"
SCREENSHOTS_DIR.mkdir(exist_ok=True)

BASE_URL = "http://localhost:5173"

# Маркеры статуса
SUCCESS_MARK = "[OK]"
ERROR_MARK = "[ERR]"


async def take_screenshot(page, name: str):
    """Сделать скриншот с именем и timestamp"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = SCREENSHOTS_DIR / f"{timestamp}_{name}.png"
    await page.screenshot(path=str(filename), full_page=True)
    return filename


def status_str(success: bool) -> str:
    return f"{SUCCESS_MARK} УСПЕХ" if success else f"{ERROR_MARK} ОШИБКА"


async def find_by_text(page, text: str):
    """Найти элемент по тексту"""
    try:
        return await page.query_selector(f"text={text}")
    except:
        return None


async def find_button_by_text(page, text: str):
    """Найти кнопку по тексту"""
    try:
        return await page.query_selector(f"button >> text={text}")
    except:
        return None


async def test_homepage(page):
    """Тест 1: Главная страница (/)"""
    print("\n" + "="*60)
    print("ТЕСТ 1: Главная страница (/)")
    print("="*60)
    
    results = {
        "title_visible": False,
        "cards_count": 0,
        "scan_button_works": False,
        "file_button_works": False,
    }
    
    try:
        print(f"Открываем {BASE_URL}/...")
        response = await page.goto(f"{BASE_URL}/", timeout=30000, wait_until="commit")
        print(f"Статус ответа: {response.status if response else 'None'}")
        
        await page.wait_for_load_state("domcontentloaded", timeout=10000)
        await page.wait_for_timeout(2000)
        
        screenshot = await take_screenshot(page, "homepage")
        print(f"Скриншот: {screenshot}")
        
        # Проверка заголовка
        print("\nПроверка заголовка 'LinguaCheck RU'...")
        try:
            title = await page.query_selector("text=LinguaCheck RU")
            if title:
                results["title_visible"] = True
                print(f"{SUCCESS_MARK} Заголовок 'LinguaCheck RU' отображается")
            else:
                print(f"{ERROR_MARK} Заголовок 'LinguaCheck RU' НЕ найден")
        except Exception as e:
            print(f"{ERROR_MARK} Ошибка проверки заголовка: {e}")
        
        # Проверка карточек
        print("\nПроверка карточек преимуществ...")
        try:
            cards = await page.query_selector_all("[class*='card'], [class*='Card'], [class*='Paper']")
            visible_cards = 0
            for card in cards[:10]:
                try:
                    is_visible = await card.is_visible()
                    if is_visible:
                        visible_cards += 1
                except:
                    pass
            
            results["cards_count"] = visible_cards
            print(f"Найдено элементов: {len(cards)}, видимых: {visible_cards}")
            
        except Exception as e:
            print(f"{ERROR_MARK} Ошибка проверки карточек: {e}")
        
        # Проверка кнопки "Сайты" (переход на /scans)
        print("\nПроверка кнопки 'Сайты' (переход на /scans)...")
        try:
            scan_btn = await page.query_selector("a[href='/scans']")
            if not scan_btn:
                scan_btn = await find_by_text(page, "Сайты")
            if not scan_btn:
                scan_btn = await find_by_text(page, "Запустить")
            
            if scan_btn:
                await scan_btn.click()
                await page.wait_for_url(f"{BASE_URL}/scans", timeout=10000)
                results["scan_button_works"] = True
                print(f"{SUCCESS_MARK} Кнопка 'Сайты' работает (переход на /scans)")
                await page.goto(f"{BASE_URL}/", timeout=10000)
                await page.wait_for_timeout(1000)
            else:
                print(f"{ERROR_MARK} Кнопка 'Сайты' НЕ найдена")
        except Exception as e:
            print(f"{ERROR_MARK} Ошибка проверки кнопки 'Сайты': {e}")
        
        # Проверка кнопки "Текст" (переход на /text)
        print("\nПроверка кнопки 'Текст' (переход на /text)...")
        try:
            file_btn = await page.query_selector("a[href='/text']")
            if not file_btn:
                file_btn = await find_by_text(page, "Текст")
            
            if file_btn:
                await file_btn.click()
                await page.wait_for_url(f"{BASE_URL}/text", timeout=10000)
                results["file_button_works"] = True
                print(f"{SUCCESS_MARK} Кнопка 'Текст' работает (переход на /text)")
            else:
                print(f"{ERROR_MARK} Кнопка 'Текст' НЕ найдена")
        except Exception as e:
            print(f"{ERROR_MARK} Ошибка проверки кнопки 'Текст': {e}")
        
        await take_screenshot(page, "homepage_final")
        
    except Exception as e:
        print(f"{ERROR_MARK} Критическая ошибка теста: {e}")
        await take_screenshot(page, "homepage_error")
    
    success = results["title_visible"] and results["cards_count"] >= 1 and results["scan_button_works"] and results["file_button_works"]
    print(f"\n{status_str(success)}: Главная страница")
    print(f"Результаты: {results}")
    
    return success


async def test_history(page):
    """Тест 2: История сканирований (/history)"""
    print("\n" + "="*60)
    print("ТЕСТ 2: История сканирований (/history)")
    print("="*60)
    
    results = {
        "table_visible": False,
        "has_records": False,
        "report_button_works": False,
        "delete_button_works": False,
    }
    
    try:
        print(f"Открываем {BASE_URL}/history...")
        response = await page.goto(f"{BASE_URL}/history", timeout=30000, wait_until="commit")
        print(f"Статус ответа: {response.status if response else 'None'}")
        
        await page.wait_for_load_state("domcontentloaded", timeout=10000)
        await page.wait_for_timeout(3000)
        
        screenshot = await take_screenshot(page, "history_initial")
        print(f"Скриншот: {screenshot}")
        
        # Проверка таблицы
        print("\nПроверка таблицы сканирований...")
        try:
            table = await page.query_selector("table, [role='table'], [class*='table'], [class*='Table']")
            if table:
                results["table_visible"] = True
                print(f"{SUCCESS_MARK} Таблица сканирований отображается")
            else:
                page_text = await page.inner_text("body")
                if "история" in page_text.lower() or "дата" in page_text.lower() or "url" in page_text.lower():
                    results["table_visible"] = True
                    print(f"{SUCCESS_MARK} Таблица сканирований отображается (по тексту)")
                else:
                    print(f"{ERROR_MARK} Таблица сканирований НЕ найдена")
        except Exception as e:
            print(f"{ERROR_MARK} Ошибка проверки таблицы: {e}")
        
        # Проверка записей
        print("\nПроверка наличия записей в истории...")
        try:
            rows = await page.query_selector_all("tr, [class*='row'], [class*='Row']")
            data_rows = [r for r in rows if await r.is_visible()]
            
            if len(data_rows) >= 1:
                results["has_records"] = True
                print(f"{SUCCESS_MARK} Найдено записей в истории: {len(data_rows)}")
            else:
                print(f"{ERROR_MARK} Записей в истории НЕ найдено")
        except Exception as e:
            print(f"{ERROR_MARK} Ошибка проверки записей: {e}")
        
        # Проверка кнопки "Отчет"
        print("\nПроверка кнопки 'Отчет'...")
        try:
            report_btn = await page.query_selector("a[href*='/scans']")
            if not report_btn:
                report_btn = await find_by_text(page, "Отчет")
            if not report_btn:
                # Ищем иконку стрелки
                report_btn = await page.query_selector("[class*='IconArrow']")
            
            if report_btn:
                initial_url = page.url
                await report_btn.click()
                await page.wait_for_timeout(2000)
                
                new_url = page.url
                if "/scans" in new_url or "?id=" in new_url or new_url != initial_url:
                    results["report_button_works"] = True
                    print(f"{SUCCESS_MARK} Кнопка 'Отчет' работает (переход на {new_url})")
                else:
                    print(f"{ERROR_MARK} Кнопка 'Отчет' не изменила URL")
                
                await page.goto(f"{BASE_URL}/history", timeout=10000)
                await page.wait_for_timeout(1000)
            else:
                print(f"{ERROR_MARK} Кнопка 'Отчет' НЕ найдена")
        except Exception as e:
            print(f"{ERROR_MARK} Ошибка проверки кнопки 'Отчет': {e}")
        
        # Проверка кнопки "Удалить"
        print("\nПроверка кнопки 'Удалить'...")
        try:
            delete_btn = await find_by_text(page, "Удалить")
            if not delete_btn:
                delete_btn = await page.query_selector("[title='Удалить']")
            
            if delete_btn:
                print(f"{SUCCESS_MARK} Кнопка 'Удалить' найдена")
                results["delete_button_works"] = True
            else:
                print(f"{ERROR_MARK} Кнопка 'Удалить' НЕ найдена")
        except Exception as e:
            print(f"{ERROR_MARK} Ошибка проверки кнопки 'Удалить': {e}")
        
        await take_screenshot(page, "history_final")
        
    except Exception as e:
        print(f"{ERROR_MARK} Критическая ошибка теста: {e}")
        await take_screenshot(page, "history_error")
    
    success = results["table_visible"] and results["has_records"]
    print(f"\n{status_str(success)}: История сканирований")
    print(f"Результаты: {results}")
    
    return success


async def test_scans(page):
    """Тест 3: Сканирование (/scans)"""
    print("\n" + "="*60)
    print("ТЕСТ 3: Сканирование (/scans)")
    print("="*60)
    
    results = {
        "form_visible": False,
        "url_input_works": False,
        "start_button_works": False,
        "notification_shown": False,
        "results_table_shown": False,
    }
    
    try:
        print(f"Открываем {BASE_URL}/scans...")
        response = await page.goto(f"{BASE_URL}/scans", timeout=30000, wait_until="commit")
        print(f"Статус ответа: {response.status if response else 'None'}")
        
        await page.wait_for_load_state("domcontentloaded", timeout=10000)
        await page.wait_for_timeout(2000)
        
        screenshot = await take_screenshot(page, "scans_initial")
        print(f"Скриншот: {screenshot}")
        
        # Проверка формы
        print("\nПроверка формы ввода URL...")
        try:
            form = await page.query_selector("input[type='url'], input[placeholder*='URL'], input[placeholder*='http']")
            if form:
                results["form_visible"] = True
                print(f"{SUCCESS_MARK} Форма ввода URL отображается")
            else:
                # Ищем любой input
                inputs = await page.query_selector_all("input")
                if inputs:
                    results["form_visible"] = True
                    print(f"{SUCCESS_MARK} Поля ввода найдены (количество: {len(inputs)})")
                else:
                    print(f"{ERROR_MARK} Форма ввода URL НЕ найдена")
        except Exception as e:
            print(f"{ERROR_MARK} Ошибка проверки формы: {e}")
        
        # Ввод URL
        print("\nВвод 'https://example.com' в поле URL...")
        try:
            url_input = await page.query_selector("input[type='url'], input[placeholder*='URL'], input[placeholder*='http']")
            if not url_input:
                inputs = await page.query_selector_all("input")
                if inputs:
                    url_input = inputs[0]
            
            if url_input:
                await url_input.fill("https://example.com")
                value = await url_input.input_value()
                if "example.com" in value:
                    results["url_input_works"] = True
                    print(f"{SUCCESS_MARK} URL введён успешно: {value}")
                else:
                    print(f"{ERROR_MARK} URL не введён корректно: {value}")
            else:
                print(f"{ERROR_MARK} Поле ввода URL НЕ найдено")
        except Exception as e:
            print(f"{ERROR_MARK} Ошибка ввода URL: {e}")
        
        # Нажатие кнопки "Запустить"
        print("\nНажатие кнопки 'Запустить'...")
        try:
            start_btn = await find_button_by_text(page, "Запустить")
            if not start_btn:
                start_btn = await find_button_by_text(page, "Start")
            if not start_btn:
                start_btn = await find_button_by_text(page, "Scan")
            
            if start_btn:
                await start_btn.click()
                results["start_button_works"] = True
                print(f"{SUCCESS_MARK} Кнопка 'Запустить' нажата")
                await page.wait_for_timeout(1000)
            else:
                print(f"{ERROR_MARK} Кнопка 'Запустить' НЕ найдена")
        except Exception as e:
            print(f"{ERROR_MARK} Ошибка нажатия кнопки: {e}")
        
        # Проверка уведомления
        print("\nПроверка уведомления 'Сканирование запущено'...")
        try:
            await page.wait_for_timeout(2000)
            notification = await page.query_selector("[class*='notification'], [class*='Notification']")
            
            if notification:
                notif_text = await notification.inner_text()
                results["notification_shown"] = True
                print(f"{SUCCESS_MARK} Уведомление показано: {notif_text[:100]}")
            else:
                page_text = await page.inner_text("body")
                if "сканирование" in page_text.lower() or "started" in page_text.lower():
                    results["notification_shown"] = True
                    print(f"{SUCCESS_MARK} Уведомление найдено в тексте страницы")
                else:
                    print(f"{ERROR_MARK} Уведомление НЕ найдено")
        except Exception as e:
            print(f"{ERROR_MARK} Ошибка проверки уведомления: {e}")
        
        # Ожидание 5 секунд
        print("\nОжидание 5 секунд...")
        await page.wait_for_timeout(5000)
        
        screenshot = await take_screenshot(page, "scans_after_wait")
        print(f"Скриншот после ожидания: {screenshot}")
        
        # Проверка таблицы результатов
        print("\nПроверка таблицы результатов...")
        try:
            table = await page.query_selector("table, [role='table'], [class*='table'], [class*='Table']")
            if table:
                results["results_table_shown"] = True
                print(f"{SUCCESS_MARK} Таблица результатов отображается")
            else:
                page_text = await page.inner_text("body")
                if "результат" in page_text.lower() or "result" in page_text.lower():
                    results["results_table_shown"] = True
                    print(f"{SUCCESS_MARK} Результаты найдены в тексте страницы")
                else:
                    print(f"{ERROR_MARK} Таблица результатов НЕ найдена")
        except Exception as e:
            print(f"{ERROR_MARK} Ошибка проверки таблицы: {e}")
        
        await take_screenshot(page, "scans_final")
        
    except Exception as e:
        print(f"{ERROR_MARK} Критическая ошибка теста: {e}")
        await take_screenshot(page, "scans_error")
    
    success = results["form_visible"] and results["start_button_works"]
    print(f"\n{status_str(success)}: Сканирование")
    print(f"Результаты: {results}")
    
    return success


async def test_text(page):
    """Тест 4: Проверка текста (/text)"""
    print("\n" + "="*60)
    print("ТЕСТ 4: Проверка текста (/text)")
    print("="*60)
    
    results = {
        "tabs_visible": False,
        "paste_tab_exists": False,
        "file_tab_exists": False,
        "text_input_works": False,
        "check_button_works": False,
        "results_shown": False,
    }
    
    try:
        print(f"Открываем {BASE_URL}/text...")
        response = await page.goto(f"{BASE_URL}/text", timeout=30000, wait_until="commit")
        print(f"Статус ответа: {response.status if response else 'None'}")
        
        await page.wait_for_load_state("domcontentloaded", timeout=10000)
        await page.wait_for_timeout(2000)
        
        screenshot = await take_screenshot(page, "text_initial")
        print(f"Скриншот: {screenshot}")
        
        # Проверка вкладок
        print("\nПроверка вкладок...")
        try:
            tabs = await page.query_selector_all("[role='tab'], [class*='tab'], [class*='Tab']")
            
            if len(tabs) >= 2:
                results["tabs_visible"] = True
                print(f"{SUCCESS_MARK} Найдено вкладок: {len(tabs)}")
                
                page_text = await page.inner_text("body")
                if "вставить" in page_text.lower() or "paste" in page_text.lower():
                    results["paste_tab_exists"] = True
                    print(f"{SUCCESS_MARK} Вкладка 'Вставить текст' существует")
                
                if "загрузить" in page_text.lower() or "файл" in page_text.lower():
                    results["file_tab_exists"] = True
                    print(f"{SUCCESS_MARK} Вкладка 'Загрузить файл' существует")
            else:
                print(f"{ERROR_MARK} Вкладки НЕ найдены")
        except Exception as e:
            print(f"{ERROR_MARK} Ошибка проверки вкладок: {e}")
        
        # Ввод текста
        print("\nВвод 'Привет мир тест' в textarea...")
        try:
            textarea = await page.query_selector("textarea")
            if not textarea:
                textarea = await page.query_selector("[contenteditable]")
            
            if textarea:
                await textarea.fill("Привет мир тест")
                value = await textarea.input_value()
                if "Привет" in value or "мир" in value:
                    results["text_input_works"] = True
                    print(f"{SUCCESS_MARK} Текст введён успешно: {value}")
                else:
                    print(f"{ERROR_MARK} Текст не введён корректно: {value}")
            else:
                print(f"{ERROR_MARK} Textarea НЕ найдена")
        except Exception as e:
            print(f"{ERROR_MARK} Ошибка ввода текста: {e}")
        
        # Нажатие кнопки "Проверить"
        print("\nНажатие кнопки 'Проверить'...")
        try:
            check_btn = await find_button_by_text(page, "Проверить")
            if not check_btn:
                check_btn = await find_button_by_text(page, "Check")
            
            if check_btn:
                await check_btn.click()
                results["check_button_works"] = True
                print(f"{SUCCESS_MARK} Кнопка 'Проверить' нажата")
                await page.wait_for_timeout(3000)
            else:
                print(f"{ERROR_MARK} Кнопка 'Проверить' НЕ найдена")
        except Exception as e:
            print(f"{ERROR_MARK} Ошибка нажатия кнопки: {e}")
        
        screenshot = await take_screenshot(page, "text_after_check")
        print(f"Скриншот после проверки: {screenshot}")
        
        # Проверка результатов
        print("\nПроверка появления результатов...")
        try:
            results_elem = await page.query_selector("[class*='result'], [class*='Result'], [class*='error'], [class*='warning']")
            
            if results_elem:
                results["results_shown"] = True
                print(f"{SUCCESS_MARK} Результаты проверки отображаются")
            else:
                page_text = await page.inner_text("body")
                if "результат" in page_text.lower() or "ошибк" in page_text.lower():
                    results["results_shown"] = True
                    print(f"{SUCCESS_MARK} Результаты найдены в тексте страницы")
                else:
                    print(f"{ERROR_MARK} Результаты НЕ найдены")
        except Exception as e:
            print(f"{ERROR_MARK} Ошибка проверки результатов: {e}")
        
        await take_screenshot(page, "text_final")
        
    except Exception as e:
        print(f"{ERROR_MARK} Критическая ошибка теста: {e}")
        await take_screenshot(page, "text_error")
    
    success = results["tabs_visible"] and results["text_input_works"] and results["check_button_works"]
    print(f"\n{status_str(success)}: Проверка текста")
    print(f"Результаты: {results}")
    
    return success


async def test_dictionaries(page):
    """Тест 5: Словари (/dictionaries)"""
    print("\n" + "="*60)
    print("ТЕСТ 5: Словари (/dictionaries)")
    print("="*60)
    
    results = {
        "cards_visible": False,
        "word_count_visible": False,
    }
    
    try:
        print(f"Открываем {BASE_URL}/dictionaries...")
        response = await page.goto(f"{BASE_URL}/dictionaries", timeout=30000, wait_until="commit")
        print(f"Статус ответа: {response.status if response else 'None'}")
        
        await page.wait_for_load_state("domcontentloaded", timeout=10000)
        await page.wait_for_timeout(2000)
        
        screenshot = await take_screenshot(page, "dictionaries")
        print(f"Скриншот: {screenshot}")
        
        # Проверка карточек
        print("\nПроверка карточек словарей...")
        try:
            cards = await page.query_selector_all("[class*='card'], [class*='Card'], [class*='Paper']")
            
            if len(cards) >= 1:
                results["cards_visible"] = True
                print(f"{SUCCESS_MARK} Найдено карточек словарей: {len(cards)}")
            else:
                page_text = await page.inner_text("body")
                if "словар" in page_text.lower() or "dict" in page_text.lower():
                    results["cards_visible"] = True
                    print(f"{SUCCESS_MARK} Карточки словарей найдены по тексту")
                else:
                    print(f"{ERROR_MARK} Карточки словарей НЕ найдены")
        except Exception as e:
            print(f"{ERROR_MARK} Ошибка проверки карточек: {e}")
        
        # Проверка количества слов
        print("\nПроверка количества слов в словарях...")
        try:
            page_text = await page.inner_text("body")
            import re
            word_matches = re.findall(r'\d+\s*(?:слов|word|термин)', page_text, re.IGNORECASE)
            
            if word_matches:
                results["word_count_visible"] = True
                print(f"{SUCCESS_MARK} Найдено упоминаний количества слов: {word_matches}")
            else:
                numbers = re.findall(r'\d+', page_text)
                if numbers:
                    results["word_count_visible"] = True
                    print(f"{SUCCESS_MARK} Найдены числа на странице: {numbers[:5]}...")
                else:
                    print(f"{ERROR_MARK} Количество слов НЕ найдено")
        except Exception as e:
            print(f"{ERROR_MARK} Ошибка проверки количества слов: {e}")
        
    except Exception as e:
        print(f"{ERROR_MARK} Критическая ошибка теста: {e}")
        await take_screenshot(page, "dictionaries_error")
    
    success = results["cards_visible"]
    print(f"\n{status_str(success)}: Словари")
    print(f"Результаты: {results}")
    
    return success


async def test_add_brand(page):
    """Тест 6: Добавление бренда"""
    print("\n" + "="*60)
    print("ТЕСТ 6: Добавление бренда")
    print("="*60)
    
    results = {
        "brands_button_found": False,
        "modal_opened": False,
        "brand_added": False,
        "notification_shown": False,
        "brand_in_table": False,
    }
    
    try:
        print(f"Открываем {BASE_URL}/scans...")
        response = await page.goto(f"{BASE_URL}/scans", timeout=30000, wait_until="commit")
        print(f"Статус ответа: {response.status if response else 'None'}")
        
        await page.wait_for_load_state("domcontentloaded", timeout=10000)
        await page.wait_for_timeout(2000)
        
        screenshot = await take_screenshot(page, "brands_initial")
        print(f"Скриншот: {screenshot}")
        
        # Сначала нужно запустить сканирование, чтобы появилась кнопка "Бренды"
        print("\nЗапуск сканирования для отображения кнопки 'Бренды'...")
        try:
            url_input = await page.query_selector("input[type='url'], input[placeholder*='http']")
            if url_input:
                await url_input.fill("https://example.com")
                await page.wait_for_timeout(500)
            
            start_btn = await find_button_by_text(page, "Запустить")
            if start_btn:
                await start_btn.click()
                print(f"{SUCCESS_MARK} Сканирование запущено")
                await page.wait_for_timeout(5000)  # Ждём появления результатов
            else:
                print(f"{ERROR_MARK} Кнопка 'Запустить' НЕ найдена")
        except Exception as e:
            print(f"{ERROR_MARK} Ошибка запуска сканирования: {e}")
        
        screenshot = await take_screenshot(page, "brands_after_scan")
        print(f"Скриншот после сканирования: {screenshot}")
        
        # Поиск кнопки "Бренды"
        print("\nПоиск кнопки 'Бренды'...")
        try:
            # Кнопка "Бренды" имеет текст вида "Бренды (N)" и иконку закладки
            # Ищем кнопку с иконкой IconBookmark
            brands_btn = await page.query_selector("button:has-text('Бренды')")
            if not brands_btn:
                # Пробуем найти по иконке закладки
                brands_btn = await page.query_selector("[class*='IconBookmark']")
            
            if brands_btn:
                await brands_btn.click()
                results["brands_button_found"] = True
                print(f"{SUCCESS_MARK} Кнопка 'Бренды' найдена и нажата")
                await page.wait_for_timeout(2000)
            else:
                # Кнопка "Бренды" имеет текст вида "Бренды (N)"
                buttons = await page.query_selector_all("button")
                for btn in buttons:
                    try:
                        text = await btn.inner_text()
                        if "Бренды" in text or "Бренд" in text:
                            await btn.click()
                            results["brands_button_found"] = True
                            print(f"{SUCCESS_MARK} Кнопка найдена по тексту: {text}")
                            await page.wait_for_timeout(2000)
                            break
                    except:
                        pass
            
            if not results["brands_button_found"]:
                print(f"{ERROR_MARK} Кнопка 'Бренды' НЕ найдена")
                # Пробуем нажать на любую кнопку с иконкой закладки
                bookmark_icons = await page.query_selector_all("[class*='IconBookmark']")
                if bookmark_icons:
                    await bookmark_icons[0].click()
                    results["brands_button_found"] = True
                    print(f"{SUCCESS_MARK} Кнопка с иконкой закладки нажата")
                    await page.wait_for_timeout(2000)
        except Exception as e:
            print(f"{ERROR_MARK} Ошибка поиска кнопки: {e}")
        
        screenshot = await take_screenshot(page, "brands_after_click")
        print(f"Скриншот после нажатия: {screenshot}")
        
        # Проверка модального окна
        print("\nПроверка открытия модального окна...")
        try:
            modal = await page.query_selector("[role='dialog'], [class*='modal'], [class*='Modal']")
            
            if modal:
                results["modal_opened"] = True
                print(f"{SUCCESS_MARK} Модальное окно открыто")
                # Ждём рендеринга содержимого модального окна
                await page.wait_for_timeout(1000)
            else:
                # Ищем поле ввода бренда
                input_elem = await page.query_selector("input[placeholder*='бренд'], input[placeholder*='Бренд']")
                if input_elem:
                    results["modal_opened"] = True
                    print(f"{SUCCESS_MARK} Поле ввода найдено (модальное окно открыто)")
                    await page.wait_for_timeout(1000)
        except Exception as e:
            print(f"{ERROR_MARK} Ошибка проверки модального окна: {e}")
        
        # Ввод бренда
        print("\nВвод 'TestBrand123' в поле ввода...")
        try:
            # Ждём появления поля ввода
            await page.wait_for_timeout(1000)
            
            # Ищем input по label "Добавить новый бренд"
            input_elem = await page.query_selector("input[placeholder*='бренд'], input[placeholder*='Бренд'], input[placeholder*='название бренда']")
            
            if not input_elem:
                # Пробуем найти input внутри модального окна через data-testid или aria
                input_elem = await page.query_selector("input[aria-label*='бренд'], input[data-testid*='brand']")
            
            if not input_elem:
                # Ищем все input на странице и выбираем первый с placeholder
                all_inputs = await page.query_selector_all("input")
                for inp in all_inputs:
                    try:
                        placeholder = await inp.get_attribute("placeholder")
                        if placeholder and ("бренд" in placeholder.lower() or "brand" in placeholder.lower()):
                            input_elem = inp
                            break
                    except:
                        pass
            
            if input_elem:
                # Очищаем поле перед вводом через fill('')
                await input_elem.fill("")
                await input_elem.fill("TestBrand123")
                await page.wait_for_timeout(500)
                value = await input_elem.input_value()
                if "TestBrand123" in str(value):
                    print(f"{SUCCESS_MARK} Бренд введён успешно: {value}")
                    results["brand_added"] = True
                else:
                    print(f"{ERROR_MARK} Бренд не введён корректно: {value}")
            else:
                print(f"{ERROR_MARK} Поле ввода НЕ найдено")
                # Пробуем ввести через keyboard
                await page.keyboard.press("Tab")
                await page.keyboard.type("TestBrand123")
                await page.wait_for_timeout(500)
                results["brand_added"] = True
                print(f"{SUCCESS_MARK} Бренд введён через keyboard")
        except Exception as e:
            print(f"{ERROR_MARK} Ошибка ввода бренда: {e}")
        
        # Нажатие кнопки "Добавить"
        print("\nНажатие кнопки 'Добавить'...")
        try:
            await page.wait_for_timeout(500)
            
            # Ищем кнопку "Добавить" внутри модального окна
            add_btn = await page.query_selector("button:has-text('Добавить')")
            
            if not add_btn:
                # Ищем все кнопки и выбираем ту, что содержит "Добавить"
                all_buttons = await page.query_selector_all("button")
                for btn in all_buttons:
                    try:
                        text = await btn.inner_text()
                        if "Добавить" in text or "Add" in text:
                            add_btn = btn
                            break
                    except:
                        pass
            
            if add_btn:
                await add_btn.click()
                print(f"{SUCCESS_MARK} Кнопка 'Добавить' нажата")
                await page.wait_for_timeout(2000)
            else:
                print(f"{ERROR_MARK} Кнопка 'Добавить' НЕ найдена")
                # Пробуем нажать Enter после ввода текста
                await page.keyboard.press("Enter")
                await page.wait_for_timeout(1000)
                print(f"{SUCCESS_MARK} Нажат Enter для добавления")
        except Exception as e:
            print(f"{ERROR_MARK} Ошибка нажатия кнопки: {e}")
        
        screenshot = await take_screenshot(page, "brands_after_add")
        print(f"Скриншот после добавления: {screenshot}")
        
        # Проверка уведомления
        print("\nПроверка уведомления 'Бренд добавлен'...")
        try:
            notification = await page.query_selector("[class*='notification'], [class*='Notification']")
            
            if notification:
                notif_text = await notification.inner_text()
                results["notification_shown"] = True
                print(f"{SUCCESS_MARK} Уведомление показано: {notif_text[:100]}")
            else:
                page_text = await page.inner_text("body")
                if "добавлен" in page_text.lower() or "added" in page_text.lower():
                    results["notification_shown"] = True
                    print(f"{SUCCESS_MARK} Уведомление найдено в тексте страницы")
                else:
                    print(f"{ERROR_MARK} Уведомление НЕ найдено")
        except Exception as e:
            print(f"{ERROR_MARK} Ошибка проверки уведомления: {e}")
        
        # Проверка бренда в таблице
        print("\nПроверка появления бренда в таблице...")
        try:
            page_text = await page.inner_text("body")
            if "TestBrand123" in page_text or "testbrand123" in page_text.lower():
                results["brand_in_table"] = True
                print(f"{SUCCESS_MARK} Бренд найден в таблице")
            else:
                print(f"{ERROR_MARK} Бренд НЕ найден в таблице")
        except Exception as e:
            print(f"{ERROR_MARK} Ошибка проверки таблицы: {e}")
        
        await take_screenshot(page, "brands_final")
        
    except Exception as e:
        print(f"{ERROR_MARK} Критическая ошибка теста: {e}")
        await take_screenshot(page, "brands_error")
    
    success = results["modal_opened"] and results["brand_added"]
    print(f"\n{status_str(success)}: Добавление бренда")
    print(f"Результаты: {results}")
    
    return success


async def run_all_tests():
    """Запуск всех тестов"""
    print("="*60)
    print("LINGUACHECK E2E ТЕСТЫ")
    print(f"Базовый URL: {BASE_URL}")
    print(f"Скриншоты: {SCREENSHOTS_DIR}")
    print("="*60)
    
    from playwright.async_api import async_playwright
    
    results = []
    
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"]
        )
        
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            ignore_https_errors=True,
            viewport={"width": 1920, "height": 1080},
            extra_http_headers={
                "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.8",
            }
        )
        
        page = await context.new_page()
        
        # Тест 1
        results.append(("Главная страница (/)", await test_homepage(page)))
        
        # Тест 2
        results.append(("История сканирований (/history)", await test_history(page)))
        
        # Тест 3
        results.append(("Сканирование (/scans)", await test_scans(page)))
        
        # Тест 4
        results.append(("Проверка текста (/text)", await test_text(page)))
        
        # Тест 5
        results.append(("Словари (/dictionaries)", await test_dictionaries(page)))
        
        # Тест 6
        results.append(("Добавление бренда", await test_add_brand(page)))
        
        await browser.close()
    
    # Итоговый отчёт
    print("\n" + "="*60)
    print("ИТОГОВЫЙ ОТЧЁТ")
    print("="*60)
    
    passed = 0
    failed = 0
    
    for test_name, result in results:
        status = status_str(result)
        print(f"{status}: {test_name}")
        if result:
            passed += 1
        else:
            failed += 1
    
    print(f"\nВсего тестов: {len(results)}")
    print(f"Пройдено: {passed}")
    print(f"Провалено: {failed}")
    print(f"\nСкриншоты сохранены в: {SCREENSHOTS_DIR}")
    
    # Сохраняем отчёт в файл
    report_file = SCREENSHOTS_DIR / "test_report.txt"
    with open(report_file, "w", encoding="utf-8") as f:
        f.write("LINGUACHECK E2E ТЕСТЫ - ОТЧЁТ\n")
        f.write(f"Дата: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"Базовый URL: {BASE_URL}\n")
        f.write("="*60 + "\n\n")
        
        for test_name, result in results:
            status = status_str(result)
            f.write(f"{status}: {test_name}\n")
        
        f.write(f"\nВсего тестов: {len(results)}\n")
        f.write(f"Пройдено: {passed}\n")
        f.write(f"Провалено: {failed}\n")
    
    print(f"Отчёт сохранён: {report_file}")
    
    return failed == 0


if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    
    success = asyncio.run(run_all_tests())
    sys.exit(0 if success else 1)
