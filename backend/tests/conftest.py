"""
Фикстуры для тестирования LinguaCheck-RU
Поддержка локальных тестов с моками и integration тестов с Render API
"""
import os
import asyncio
import time
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from httpx import AsyncClient, ASGITransport
from app.main import app
# Глубокое мокирование Supabase
def create_new_mock_supabase():
    mock_supabase = MagicMock()
    _tables = {}
    
    def get_table_mock(table_name):
        if table_name not in _tables:
            table_mock = MagicMock()
            mock_resp = AsyncMock()
            mock_resp.data = []
            mock_resp.execute = AsyncMock(return_value=mock_resp)
            
            table_mock.select.return_value = table_mock
            table_mock.insert.return_value = table_mock
            table_mock.delete.return_value = table_mock
            table_mock.update.return_value = table_mock
            table_mock.eq.return_value = table_mock
            table_mock.neq.return_value = table_mock
            table_mock.execute = mock_resp.execute
            _tables[table_name] = table_mock
        return _tables[table_name]

    mock_supabase.table.side_effect = get_table_mock
    return mock_supabase

_base_mock_supabase = create_new_mock_supabase()

async def _mock_create_async_client(*args, **kwargs):
    return _base_mock_supabase

# Патчим саму библиотеку supabase во всех местах использования
patch("app.supabase_client.create_async_client", _mock_create_async_client).start()
# А также на всякий случай саму функцию get_async_supabase
async def _get_global_mock_supabase(): return _base_mock_supabase
patch("app.supabase_client.get_async_supabase", _get_global_mock_supabase).start()
patch("app.routers.scans.get_async_supabase", _get_global_mock_supabase).start()
patch("app.routers.trademarks.get_async_supabase", _get_global_mock_supabase).start()
patch("app.routers.exceptions.get_async_supabase", _get_global_mock_supabase).start()
patch("app.services.scan_service.get_async_supabase", _get_global_mock_supabase).start()
patch("app.services.token_service.get_async_supabase", _get_global_mock_supabase).start()

# Мокируем Celery
mock_celery = MagicMock()
patch("celery.Celery", return_value=mock_celery).start()

# Мокируем задачи
mock_task = MagicMock()
mock_task.delay.return_value = MagicMock(id="test-task-id")
patch("app.routers.scans.run_scan_task", mock_task).start()

# Мокируем redis_service
mock_redis = AsyncMock()
mock_redis.get.return_value = None
mock_redis.set.return_value = None
mock_redis.connect = AsyncMock()
mock_redis.connect.return_value = None
patch("app.services.token_service.redis_service", mock_redis).start()
patch("app.services.redis_service.redis_service", mock_redis).start()


@pytest.fixture
def mock_supabase_client():
    """Возвращает единый мок, который используется и в приложении, и в тестах"""
    return _base_mock_supabase


# Режим тестирования: local (с моками) или integration (с реальным API)
TEST_MODE = os.getenv("TEST_MODE", "local")
RENDER_API_URL = os.getenv("RENDER_API_URL", "http://127.0.0.1:8000")


def generate_test_id(prefix: str) -> str:
    """
    Генерирует уникальный ID для теста
    
    Args:
        prefix: Префикс для ID (например, "scan", "trademark")
    
    Returns:
        Уникальный ID в формате "{prefix}-{timestamp}-{nanoseconds}"
    """
    return f"{prefix}-{int(time.time())}-{time.time_ns() % 1000}"


@pytest.fixture
def unique_id():
    """Фикстура для генерации уникального ID"""
    return generate_test_id


@pytest.fixture
async def client():
    """
    Тестовый клиент с выбором режима
    
    Local mode: использует ASGITransport для быстрых локальных тестов
    Integration mode: подключается к реальному API на Render
    """
    if TEST_MODE == "integration":
        # Реальный клиент для Render API
        async with AsyncClient(
            base_url=RENDER_API_URL,
            timeout=60.0,  # Увеличенный таймаут для холодного старта
            follow_redirects=True
        ) as ac:
            yield ac
    else:
        # Локальный клиент с ASGITransport (быстро, без сети)
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
            timeout=30.0
        ) as ac:
            yield ac




@pytest.fixture
def mock_supabase_with_data():
    """
    Фабрика для создания моков с тестовыми данными
    
    Returns:
        Функция, создающая мок с указанными данными
    """
    def _create_mock(data=None, count=0):
        client = MagicMock()
        
        mock_response = AsyncMock()
        mock_response.data = data or []
        mock_response.count = count
        mock_response.execute = AsyncMock(return_value=mock_response)
        
        table_mock = MagicMock()
        table_mock.select.return_value = table_mock
        table_mock.insert.return_value = table_mock
        table_mock.delete.return_value = table_mock
        table_mock.update.return_value = table_mock
        table_mock.eq.return_value = table_mock
        table_mock.neq.return_value = table_mock
        table_mock.in_.return_value = table_mock
        table_mock.like.return_value = table_mock
        table_mock.limit.return_value = table_mock
        table_mock.order.return_value = table_mock
        table_mock.execute = mock_response.execute
        
        client.table.return_value = table_mock
        
        return client
    
    return _create_mock


@pytest.fixture
def mock_trademark_data():
    """Тестовые данные для бренда"""
    return {
        "id": generate_test_id("tm"),
        "word": "TestBrand",
        "normal_form": "testbrand",
        "created_at": "2026-03-11T00:00:00Z"
    }


@pytest.fixture
def mock_exception_data():
    """Тестовые данные для исключения"""
    return {
        "id": generate_test_id("exc"),
        "word": "testexception",
        "created_at": "2026-03-11T00:00:00Z"
    }


@pytest.fixture
def mock_scan_data():
    """Тестовые данные для скана"""
    scan_id = generate_test_id("scan")
    return {
        "id": scan_id,
        "project_id": generate_test_id("project"),
        "target_url": "https://test.com",
        "status": "completed",
        "created_at": "2026-03-11T00:00:00Z"
    }


@pytest.fixture
async def cleanup_database():
    """
    Фикстура для очистки БД после тестов
    
    Очищает тестовые данные по префиксу и шаблонам.
    Работает только в integration режиме.
    """
    yield
    
    if TEST_MODE == "integration":
        # Очистка в integration режиме
        try:
            client = await get_async_supabase()
            
            # Очищаем по префиксу "test-"
            tables = ["violations", "pages", "scans", "projects"]
            for table in tables:
                await client.table(table).delete().like("id", "test-%").execute()
            
            # Очищаем по шаблонам слов
            await client.table("trademarks").delete().like("word", "Test%").execute()
            await client.table("trademarks").delete().like("word", "Duplicate%").execute()
            await client.table("trademarks").delete().like("word", "ToDelete%").execute()
            await client.table("trademarks").delete().like("word", "Spaced%").execute()
            
            await client.table("global_exceptions").delete().like("word", "test%").execute()
            await client.table("global_exceptions").delete().like("word", "Test%").execute()
            await client.table("global_exceptions").delete().like("word", "unique%").execute()
            await client.table("global_exceptions").delete().like("word", "toDelete%").execute()
            
        except Exception as e:
            # Игнорируем ошибки очистки в integration режиме
            print(f"Warning: Failed to cleanup database: {e}")


@pytest.fixture(scope="session")
def event_loop_policy():
    """
    Настройка event loop policy для Windows

    Необходимо для корректной работы asyncio на Windows
    """
    import sys
    if sys.platform == "win32":
        return asyncio.WindowsProactorEventLoopPolicy()
    return asyncio.DefaultEventLoopPolicy()


@pytest.fixture
async def warmup_api(client):
    """
    Прогрев API перед тестами
    
    Необходимо для Render (холодный старт 30-60с)
    """
    if TEST_MODE == "integration":
        # Ждем пока API "проснется"
        max_attempts = 10
        for attempt in range(max_attempts):
            try:
                response = await client.get("/api/v1/health")
                if response.status_code == 200:
                    data = response.json()
                    if data.get("status") == "ok":
                        break
            except Exception:
                pass
            
            if attempt < max_attempts - 1:
                await asyncio.sleep(3)  # Ждем 3 секунды перед следующей попыткой
    
    yield


# Хелперы для создания тестовых данных

async def create_test_trademark(client, word: str):
    """
    Создает тестовый бренд через API
    
    Args:
        client: Тестовый клиент
        word: Слово для бренда
    
    Returns:
        ID созданного бренда
    """
    response = await client.post(
        "/api/v1/trademarks",
        json={"word": word}
    )
    if response.status_code in [200, 201]:
        return response.json()["id"]
    return None


async def create_test_exception(client, word: str):
    """
    Создает тестовое исключение через API
    
    Args:
        client: Тестовый клиент
        word: Слово для исключения
    
    Returns:
        ID созданного исключения
    """
    response = await client.post(
        "/api/v1/exceptions",
        json={"word": word}
    )
    if response.status_code in [200, 201]:
        return response.json()["id"]
    return None


async def create_test_scan(client, url: str, scan_id: str = None):
    """
    Создает тестовый скан через API
    
    Args:
        client: Тестовый клиент
        url: URL для сканирования
        scan_id: Опциональный ID скана
    
    Returns:
        ID созданного скана
    """
    scan_id = scan_id or generate_test_id("scan")
    response = await client.post(
        "/api/v1/scan",
        json={"url": url}
    )
    if response.status_code in [200, 202]:
        data = response.json()
        return data.get("scan_id") or data.get("id")
    return None
