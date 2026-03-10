# 🧪 Руководство по тестированию LinguaCheck-RU

## Обзор

Система тестирования LinguaCheck-RU обеспечивает **90% покрытие кода** и включает:

- **Backend тесты** (pytest) - 28 тестов
- **API тесты** (pytest + httpx) - 45 тестов  
- **E2E тесты** (Playwright) - 30 тестов
- **Frontend тесты** (Vitest) - в разработке

## 📁 Структура тестов

```
russian-lang/
├── backend/tests/
│   ├── test_token_service.py      # Тесты анализа текста
│   ├── test_scan_service.py       # Тесты сканирования
│   ├── test_api_endpoints.py      # Тесты API endpoints
│   └── test_analysis.py           # Тесты морфологического анализа
├── tests/
│   └── test_e2e_playwright.py     # E2E тесты
└── test_results/                   # Результаты тестов
    └── screenshots/                # Скриншоты ошибок
```

## 🚀 Запуск тестов

### Backend тесты

```bash
cd backend

# Все тесты
python -m pytest tests/ -v

# С покрытием
python -m pytest tests/ -v --cov=app --cov-report=html

# Конкретный файл
python -m pytest tests/test_token_service.py -v

# Конкретный тест
python -m pytest tests/test_token_service.py::TestStaticExceptions -v
```

### E2E тесты

```bash
# Убедитесь что backend и frontend запущены
python -m pytest tests/test_e2e_playwright.py -v

# С скриншотами
python -m pytest tests/test_e2e_playwright.py -v --screenshot=on

# Только мобильные тесты
python -m pytest tests/test_e2e_playwright.py::TestResponsiveDesign -v
```

### Frontend тесты (в разработке)

```bash
npm run test
```

## 📊 Покрытие кода

### Текущее покрытие

| Компонент | Покрытие | Статус |
|-----------|----------|--------|
| token_service.py | 95% | ✅ |
| scan_service.py | 88% | ⚠️ |
| api_endpoints | 92% | ✅ |
| analysis.py | 90% | ✅ |

### Цели

- **Backend**: 90%+
- **Frontend**: 85%+
- **E2E**: 100% критических путей

## 🧩 Категории тестов

### 1. Модульные тесты (Unit Tests)

Тестируют отдельные функции и классы:

```python
# test_token_service.py
def test_email_variations_in_exceptions():
    assert "email" in _STATIC_EXCEPTIONS
    assert "e-mail" in _STATIC_EXCEPTIONS

def test_is_anglicism():
    assert _is_anglicism("менеджер") is True
    assert _is_anglicism("дом") is False
```

### 2. Интеграционные тесты (Integration Tests)

Тестируют взаимодействие компонентов:

```python
# test_api_endpoints.py
async def test_create_trademark(client):
    response = await client.post(
        "/api/v1/trademarks",
        json={"word": "TestBrand"}
    )
    assert response.status_code == 201
```

### 3. E2E тесты (End-to-End)

Тестируют полные пользовательские сценарии:

```python
# test_e2e_playwright.py
async def test_full_scan_workflow(page):
    await page.goto("/scans")
    await page.fill("input", "https://example.com")
    await page.click("button:has-text('Запустить')")
    await page.wait_for_selector("text=Сканирование запущено")
```

## 🔧 Фикстуры

### Backend фикстуры

```python
@pytest.fixture
async def client():
    """Тестовый HTTP клиент"""
    async with AsyncClient(...) as ac:
        yield ac

@pytest.fixture
async def cleanup_database():
    """Очистка БД после тестов"""
    yield
    # Очистка...
```

### E2E фикстуры

```python
@pytest.fixture(scope="session")
async def browser():
    """Браузер для всех тестов"""
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        yield browser

@pytest.fixture
async def page(context):
    """Новая страница для каждого теста"""
    page = await context.new_page()
    yield page
    await page.close()
```

## 📝 Написание новых тестов

### Шаблон модульного теста

```python
import pytest
from app.services.token_service import analyze_text

class TestNewFeature:
    """Тесты новой функции"""
    
    @pytest.mark.asyncio
    async def test_feature_name(self):
        """Описание что тестируется"""
        # Arrange
        text = "тестовые данные"
        
        # Act
        result = await analyze_text(text)
        
        # Assert
        assert result.summary.violations_count == 0
```

### Шаблон E2E теста

```python
import pytest
from playwright.async_api import Page

class TestNewPage:
    """Тесты новой страницы"""
    
    @pytest.mark.asyncio
    async def test_page_loads(self, page: Page):
        """Страница должна загружаться"""
        await page.goto(f"{BASE_URL}/new-page")
        await page.wait_for_load_state("domcontentloaded")
        
        # Проверяем заголовок
        await page.wait_for_selector("h1:has-text('Заголовок')")
```

## 🎯 Критические пути тестирования

### 1. Сканирование сайтов

- ✅ Запуск сканирования
- ✅ Отслеживание статуса
- ✅ Отображение результатов
- ✅ Фильтрация нарушений
- ✅ Экспорт в Excel/PDF

### 2. Проверка текста

- ✅ Ввод текста
- ✅ Загрузка файла
- ✅ Отображение нарушений
- ✅ Добавление в бренды
- ✅ Добавление в исключения

### 3. Управление брендами

- ✅ Просмотр списка
- ✅ Добавление бренда
- ✅ Удаление бренда
- ✅ Проверка дубликатов

### 4. Глобальные исключения

- ✅ Просмотр списка
- ✅ Добавление исключения
- ✅ Удаление исключения
- ✅ Проверка дубликатов

## 🐛 Отладка тестов

### Логирование

```python
import logging

logger = logging.getLogger(__name__)

def test_with_logging():
    logger.info("Starting test...")
    # Тест...
    logger.info("Test completed")
```

### Скриншоты при ошибке

```python
@pytest.mark.asyncio
async def test_with_screenshot(page):
    try:
        await page.goto(BASE_URL)
        # Тест...
    except Exception as e:
        await page.screenshot(path="error.png")
        raise
```

### Пошаговая отладка

```bash
# Запуск одного теста с подробным выводом
python -m pytest tests/test.py::test_name -v -s

# Остановка при первой ошибке
python -m pytest tests/ -x

# Показ локальных переменных при ошибке
python -m pytest tests/ --showlocals
```

## 📈 Метрики качества

### Покрытие кода

```bash
# Проверка порога покрытия
coverage report --fail-under=90

# HTML отчет
coverage html
# Открыть htmlcov/index.html
```

### Время выполнения

```bash
# Показ времени каждого теста
python -m pytest tests/ -v --durations=10

# Самые медленные тесты
python -m pytest tests/ -v --durations=5
```

### Статистика тестов

```bash
# Общее количество тестов
python -m pytest tests/ --collect-only

# JSON отчет
python -m pytest tests/ --result-log=report.json
```

## 🔄 CI/CD интеграция

### GitHub Actions

Тесты запускаются автоматически при:
- Push в `main` или `develop`
- Pull Request в `main`

### Требования для merge

- ✅ Все тесты проходят
- ✅ Покрытие >= 90%
- ✅ Линтеры проходят
- ✅ E2E тесты проходят

## 🎓 Лучшие практики

1. **Изоляция тестов**: Каждый тест должен быть независимым
2. **Чистые фикстуры**: Очищать данные после тестов
3. **Осмысленные имена**: `test_create_trademark_success`
4. **Один ассерт на тест**: В идеале один assert на тест
5. **Параметризация**: Использовать `@pytest.mark.parametrize`
6. **Моки внешних сервисов**: Не зависеть от внешних API

## 📚 Ресурсы

- [pytest документация](https://docs.pytest.org/)
- [Playwright документация](https://playwright.dev/python/)
- [Coverage.py](https://coverage.readthedocs.io/)
- [pytest-asyncio](https://github.com/pytest-dev/pytest-asyncio)
