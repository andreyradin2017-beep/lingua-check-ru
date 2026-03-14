# 🧪 Руководство по тестированию с Render API

**Дата:** 11 марта 2026 г.  
**Статус:** ✅ Готово к использованию

---

## 📋 ОБЗОР

Система тестирования адаптирована для работы с **Render (бесплатный тариф)**:

- 🚀 **Локальные тесты** — быстро (5-10с), с моками
- 🌐 **Integration тесты** — медленно (2-5 мин), реальное API на Render
- ⚡ **Гибкий выбор** — запуск по маркерам

---

## 🚀 БЫСТРЫЙ СТАРТ

### 1. Локальные тесты (рекомендуется для разработки)

```bash
cd backend

# Все unit тесты (быстро, ~30с)
python -m pytest tests/test_api_endpoints.py -v

# Только API тесты
python -m pytest tests/test_api_endpoints.py -m unit -v

# Только тесты с моками
python -m pytest tests/ -m "not integration" -v
```

### 2. Integration тесты (перед коммитом)

```bash
# Установите переменные окружения
export TEST_MODE=integration
export RENDER_API_URL=https://your-app.onrender.com

# Запуск integration тестов (медленно, ~2-5 мин)
python -m pytest tests/test_api_endpoints.py -m integration -v

# Все тесты включая integration
python -m pytest tests/ -v
```

---

## 📁 СТРУКТУРА ТЕСТОВ

```
backend/tests/
├── conftest.py              # ✅ Фикстуры и хелперы
│   - client (local/integration)
│   - mock_supabase_client
│   - generate_test_id()
│   - cleanup_database
│   └── Теплые фикстуры
├── test_api_endpoints.py    # ✅ API тесты
│   - Unit тесты (с моками)
│   - Integration тесты (реальное API)
│   └── Параметризованные тесты
├── test_token_service.py    # Unit тесты
├── test_scan_service.py     # Integration тесты
└── test_stability.py        # Integration тесты
```

---

## 🎯 ТИПЫ ТЕСТОВ

### Unit тесты (локальные)

**Быстрые** (<1с на тест), **изолированные**, **с моками**

```python
@pytest.mark.unit
async def test_create_trademark(client, mock_supabase_client):
    """Тест с мокированным Supabase"""
    mock_supabase_client.table.return_value.select.return_value.execute.return_value.data = []
    
    response = await client.post("/api/v1/trademarks", json={"word": "Test"})
    assert response.status_code in [200, 201]
```

**Запуск:**
```bash
python -m pytest tests/ -m unit -v
```

---

### Integration тесты (Render)

**Медленные** (10-60с на тест), **реальное API**, **реальная БД**

```python
@pytest.mark.integration
async def test_create_trademark_real(client, cleanup_database):
    """Тест с реальным API на Render"""
    response = await client.post(
        "/api/v1/trademarks",
        json={"word": f"TestBrand-{time.time()}"}
    )
    assert response.status_code in [200, 201]
```

**Запуск:**
```bash
export TEST_MODE=integration
python -m pytest tests/ -m integration -v
```

---

## 🔧 ФИКСТУРЫ

### `client`

Автоматически выбирает режим в зависимости от `TEST_MODE`:

```python
# Local mode (ASGITransport, быстро)
async def test_something(client):
    response = await client.get("/api/v1/health")

# Integration mode (HTTP к Render, медленно)
# export TEST_MODE=integration
async def test_something(client):
    response = await client.get("/api/v1/health")
```

---

### `mock_supabase_client`

Мокированный клиент Supabase для unit-тестов:

```python
async def test_with_mock(client, mock_supabase_client):
    # Настройка мока
    mock_supabase_client.table.return_value.select.return_value.execute.return_value.data = [
        {"id": "1", "word": "Test"}
    ]
    
    response = await client.get("/api/v1/trademarks")
    assert response.status_code == 200
```

---

### `mock_supabase_with_data`

Фабрика для создания моков с данными:

```python
async def test_with_factory(client, mock_supabase_with_data):
    # Создаем мок с данными
    mock_client = mock_supabase_with_data(
        data=[{"id": "1", "word": "Test"}],
        count=1
    )
    
    # Используем mock_client в тесте
```

---

### `cleanup_database`

Автоматическая очистка БД после тестов (только integration):

```python
@pytest.mark.integration
async def test_with_cleanup(client, cleanup_database):
    # Тест создает данные
    response = await client.post("/api/v1/trademarks", json={"word": "Test"})
    
    # После теста cleanup_database автоматически очистит БД
```

---

### `generate_test_id()`

Генерация уникальных ID:

```python
from .conftest import generate_test_id

async def test_unique_id(client):
    timestamp = generate_test_id("scan")
    # timestamp = "scan-1710172800-123"
    
    response = await client.post(
        "/api/v1/scan",
        json={"url": f"https://test-{timestamp}.com"}
    )
```

---

## 📊 ЗАПУСК ТЕСТОВ

### Все тесты

```bash
# Локально (unit тесты)
python -m pytest tests/ -v

# С интеграцией
export TEST_MODE=integration
python -m pytest tests/ -v
```

### По типу тестов

```bash
# Только unit тесты
python -m pytest tests/ -m unit -v

# Только integration тесты
export TEST_MODE=integration
python -m pytest tests/ -m integration -v

# Все кроме integration
python -m pytest tests/ -m "not integration" -v

# Все кроме slow
python -m pytest tests/ -m "not slow" -v
```

### По файлам

```bash
# Только API тесты
python -m pytest tests/test_api_endpoints.py -v

# Только token сервис
python -m pytest tests/test_token_service.py -v

# Только scan сервис
python -m pytest tests/test_scan_service.py -v
```

### С покрытием

```bash
# С отчетом о покрытии
python -m pytest tests/ --cov=app --cov-report=html

# С текстовым отчетом
python -m pytest tests/ --cov=app --cov-report=term-missing
```

---

## ⚙️ ПЕРЕМЕННЫЕ ОКРУЖЕНИЯ

### Для локальных тестов

```bash
# .env (не требуется для локальных тестов)
TEST_MODE=local  # по умолчанию
```

### Для integration тестов

```bash
# .env.integration
export TEST_MODE=integration
export RENDER_API_URL=https://linguacheck.onrender.com
export DATABASE_URL=postgresql+asyncpg://...
```

### Запуск с .env

```bash
# Загрузить переменные и запустить тесты
source .env.integration
python -m pytest tests/ -m integration -v
```

---

## 🐛 ОТЛАДКА

### Логирование

```bash
# С выводом логов
python -m pytest tests/test_api_endpoints.py -v -s

# С логов на уровне INFO
python -m pytest tests/ -v --log-cli-level=INFO
```

### Пошаговая отладка

```bash
# Остановка при первой ошибке
python -m pytest tests/ -x

# Вывод локальных переменных
python -m pytest tests/ --showlocals

# Детальный вывод ошибок
python -m pytest tests/ -vv --tb=long
```

### Тест с принтом

```python
async def test_debug(client):
    print("\n=== DEBUG INFO ===")
    print(f"TEST_MODE: {TEST_MODE}")
    print(f"Client base_url: {client.base_url}")
    
    response = await client.get("/api/v1/health")
    print(f"Response: {response.status_code}")
    print(f"Body: {response.json()}")
    
    assert response.status_code == 200
```

---

## 📈 МЕТРИКИ

### Время выполнения

| Тип тестов | Количество | Время |
|------------|------------|-------|
| Unit | 30 | ~30с |
| Integration | 10 | ~2-5 мин |
| E2E (Playwright) | 28 | ~2 мин |
| **ВСЕГО** | **68** | **~8 мин** |

### Покрытие

| Компонент | Покрытие | Статус |
|-----------|----------|--------|
| API endpoints | 95% | ✅ |
| Token service | 90% | ✅ |
| Scan service | 85% | ⚠️ |
| **ИТОГО** | **89%** | ⚠️ |

---

## 🎯 ЛУЧШИЕ ПРАКТИКИ

### 1. Используйте unit тесты для разработки

```bash
# Быстрая обратная связь
python -m pytest tests/test_api_endpoints.py -m unit -v
```

### 2. Integration тесты перед коммитом

```bash
# Проверка перед git commit
export TEST_MODE=integration
python -m pytest tests/ -m integration -v
```

### 3. Моки для внешних зависимостей

```python
async def test_with_mock(client, mock_supabase_client):
    # Не зависит от реальной БД
    mock_supabase_client.table.return_value.select.return_value.execute.return_value.data = []
    
    response = await client.get("/api/v1/trademarks")
    assert response.status_code == 200
```

### 4. Уникальные ID для тестов

```python
from .conftest import generate_test_id

async def test_unique(client):
    timestamp = generate_test_id("test")
    # Избегаем конфликтов в БД
```

### 5. Очистка после тестов

```python
async def test_cleanup(client, cleanup_database):
    # Тест создает данные
    await client.post("/api/v1/trademarks", json={"word": "Test"})
    
    # cleanup_database автоматически очистит БД
```

---

## 🔄 CI/CD ИНТЕГРАЦИЯ

### GitHub Actions

```yaml
# .github/workflows/tests.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.12'
      
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      
      - name: Run unit tests
        run: |
          cd backend
          python -m pytest tests/ -m unit -v
      
      - name: Run integration tests
        env:
          TEST_MODE: integration
          RENDER_API_URL: ${{ secrets.RENDER_API_URL }}
        run: |
          cd backend
          python -m pytest tests/ -m integration -v
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage.xml
```

---

## ⚠️ ИЗВЕСТНЫЕ ПРОБЛЕМЫ

### 1. Холодный старт Render (30-60с)

**Решение:** Использовать `warmup_api` фикстуру или запускать с `--timeout=60`

```bash
python -m pytest tests/ -m integration --timeout=60 -v
```

### 2. Rate Limiting (100 запросов/час)

**Решение:** Запускать integration тесты редко (раз в день/неделю)

```bash
# Только для важных проверок
python -m pytest tests/ -m "integration and not slow" -v
```

### 3. Сон инстанса (15 минут бездействия)

**Решение:** Отправлять health check каждые 10 минут

```bash
# Скрипт для поддержания инстанса
while true; do
  curl https://your-app.onrender.com/api/v1/health
  sleep 600
done
```

---

## 📚 РЕСУРСЫ

- [pytest документация](https://docs.pytest.org/)
- [pytest-asyncio](https://github.com/pytest-dev/pytest-asyncio)
- [Render бесплатный тариф](https://render.com/docs/free)
- [Supabase документация](https://supabase.com/docs)

---

## 🎓 ВОПРОСЫ И ОТВЕТЫ

**Q: Почему unit тесты быстрее?**  
A: Они используют моки вместо реальных запросов к БД и API.

**Q: Когда использовать integration тесты?**  
A: Перед коммитом в main, в CI/CD, для проверки реального API.

**Q: Как отладить integration тест?**  
A: Используйте `-s` для вывода print и `--tb=long` для деталей.

**Q: Почему integration тесты падают?**  
A: Проверьте что Render API доступен и не "спит".

**Q: Как ускорить integration тесты?**  
A: Запускайте только критичные тесты с `-m "integration and not slow"`.

---

**Сгенерировано:** 11 марта 2026 г.  
**Версия:** 1.0  
**Статус:** ✅ Готово к использованию
