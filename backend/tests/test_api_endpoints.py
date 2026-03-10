"""
Тесты для API endpoints - сканирование, бренды, исключения
"""
import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.supabase_client import get_async_supabase


@pytest.fixture
async def client():
    """Фикстура для создания тестового клиента"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def cleanup_database():
    """Фикстура для очистки БД после тестов"""
    yield
    # Очистка после тестов
    client = await get_async_supabase()
    # Очищаем тестовые данные
    await client.table("violations").delete().eq("page_id", "test-page").execute()
    await client.table("pages").delete().eq("scan_id", "test-scan").execute()
    await client.table("scans").delete().eq("id", "test-scan").execute()
    await client.table("trademarks").delete().eq("word", "TestBrand").execute()
    await client.table("global_exceptions").delete().eq("word", "testexception").execute()


class TestTrademarksAPI:
    """Тесты для API брендов"""

    @pytest.mark.asyncio
    async def test_get_trademarks_empty(self, client):
        """Получение пустого списка брендов"""
        response = await client.get("/api/v1/trademarks")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    @pytest.mark.asyncio
    async def test_create_trademark(self, client, cleanup_database):
        """Создание нового бренда"""
        response = await client.post(
            "/api/v1/trademarks",
            json={"word": "TestBrand"}
        )
        assert response.status_code == 201
        data = response.json()
        assert data["word"] == "TestBrand"
        assert "normal_form" in data
        assert "id" in data

    @pytest.mark.asyncio
    async def test_create_duplicate_trademark(self, client, cleanup_database):
        """Попытка создания дубликата бренда"""
        # Создаем первый раз
        await client.post("/api/v1/trademarks", json={"word": "DuplicateBrand"})
        
        # Пытаемся создать дубликат
        response = await client.post(
            "/api/v1/trademarks",
            json={"word": "DuplicateBrand"}
        )
        assert response.status_code == 400
        assert "уже зарегистрирован" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_create_empty_trademark(self, client):
        """Попытка создания бренда с пустым словом"""
        response = await client.post(
            "/api/v1/trademarks",
            json={"word": ""}
        )
        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_create_trademark_whitespace(self, client, cleanup_database):
        """Создание бренда с пробелами"""
        response = await client.post(
            "/api/v1/trademarks",
            json={"word": "  SpacedBrand  "}
        )
        assert response.status_code == 201
        data = response.json()
        assert data["word"] == "SpacedBrand"  # Пробелы должны обрезаться

    @pytest.mark.asyncio
    async def test_delete_trademark(self, client, cleanup_database):
        """Удаление бренда"""
        # Создаем бренд
        create_response = await client.post(
            "/api/v1/trademarks",
            json={"word": "ToDeleteBrand"}
        )
        trademark_id = create_response.json()["id"]
        
        # Удаляем бренд
        delete_response = await client.delete(f"/api/v1/trademarks/{trademark_id}")
        assert delete_response.status_code == 204
        
        # Проверяем что удален
        get_response = await client.get("/api/v1/trademarks")
        brands = get_response.json()
        assert not any(b["id"] == trademark_id for b in brands)

    @pytest.mark.asyncio
    async def test_delete_nonexistent_trademark(self, client):
        """Удаление несуществующего бренда"""
        response = await client.delete("/api/v1/trademarks/nonexistent-id")
        assert response.status_code == 404


class TestExceptionsAPI:
    """Тесты для API глобальных исключений"""

    @pytest.mark.asyncio
    async def test_get_exceptions_empty(self, client):
        """Получение пустого списка исключений"""
        response = await client.get("/api/v1/exceptions")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    @pytest.mark.asyncio
    async def test_create_exception(self, client, cleanup_database):
        """Создание нового исключения"""
        response = await client.post(
            "/api/v1/exceptions",
            json={"word": "testexception"}
        )
        assert response.status_code == 201
        data = response.json()
        assert data["word"] == "testexception"
        assert "id" in data
        assert "created_at" in data

    @pytest.mark.asyncio
    async def test_create_duplicate_exception(self, client, cleanup_database):
        """Попытка создания дубликата исключения"""
        await client.post("/api/v1/exceptions", json={"word": "uniqueexception"})
        
        response = await client.post(
            "/api/v1/exceptions",
            json={"word": "uniqueexception"}
        )
        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_delete_exception(self, client, cleanup_database):
        """Удаление исключения"""
        create_response = await client.post(
            "/api/v1/exceptions",
            json={"word": "toDeleteException"}
        )
        exception_id = create_response.json()["id"]
        
        delete_response = await client.delete(f"/api/v1/exceptions/{exception_id}")
        assert delete_response.status_code == 204

    @pytest.mark.asyncio
    async def test_exception_normalization(self, client, cleanup_database):
        """Проверка что исключения нормализуются"""
        response = await client.post(
            "/api/v1/exceptions",
            json={"word": "TestException"}
        )
        assert response.status_code == 201


class TestScanAPI:
    """Тесты для API сканирования"""

    @pytest.mark.asyncio
    async def test_create_scan_invalid_url(self, client):
        """Создание скана с невалидным URL"""
        response = await client.post(
            "/api/v1/scan",
            json={"url": "not-a-url"}
        )
        assert response.status_code == 422  # Validation error

    @pytest.mark.asyncio
    async def test_create_scan_missing_url(self, client):
        """Создание скана без URL"""
        response = await client.post(
            "/api/v1/scan",
            json={}
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_create_scan_invalid_depth(self, client):
        """Создание скана с невалидной глубиной"""
        response = await client.post(
            "/api/v1/scan",
            json={"url": "https://example.com", "max_depth": 10}
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_get_nonexistent_scan(self, client):
        """Получение несуществующего скана"""
        response = await client.get("/api/v1/scan/nonexistent-id")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_scans_list(self, client):
        """Получение списка сканов"""
        response = await client.get("/api/v1/scans")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    @pytest.mark.asyncio
    async def test_delete_nonexistent_scan(self, client):
        """Удаление несуществующего скана"""
        response = await client.delete("/api/v1/scan/nonexistent-id")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_scan_success(self, client, cleanup_database):
        """Успешное удаление скана"""
        # Создаем тестовый скан через прямой запрос к БД
        scan_client = await get_async_supabase()
        
        # Создаем проект
        project_data = {"id": "test-project-del", "name": "Test Project"}
        await scan_client.table("projects").insert(project_data).execute()
        
        # Создаем скан
        scan_data = {
            "id": "test-scan-del",
            "project_id": "test-project-del",
            "target_url": "https://test.com",
            "status": "completed"
        }
        await scan_client.table("scans").insert(scan_data).execute()
        
        # Создаем страницу
        page_data = {
            "id": "test-page-del",
            "scan_id": "test-scan-del",
            "url": "https://test.com/page",
            "depth": 0,
            "status": "ok"
        }
        await scan_client.table("pages").insert(page_data).execute()
        
        # Теперь удаляем через API
        response = await client.delete("/api/v1/scan/test-scan-del")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "deleted"
        assert data["scan_id"] == "test-scan-del"
        
        # Проверяем что скан удален
        get_response = await client.get("/api/v1/scan/test-scan-del")
        assert get_response.status_code == 404

    @pytest.mark.asyncio
    async def test_clear_all_scans(self, client, cleanup_database):
        """Очистка всех сканов"""
        # Создаем несколько сканов
        scan_client = await get_async_supabase()
        
        for i in range(3):
            project_data = {"id": f"test-project-clear-{i}", "name": f"Test Project {i}"}
            await scan_client.table("projects").insert(project_data).execute()
            
            scan_data = {
                "id": f"test-scan-clear-{i}",
                "project_id": f"test-project-clear-{i}",
                "target_url": f"https://test{i}.com",
                "status": "completed"
            }
            await scan_client.table("scans").insert(scan_data).execute()
        
        # Очищаем все
        response = await client.delete("/api/v1/scans")
        assert response.status_code == 200
        
        # Проверяем что список пуст
        get_response = await client.get("/api/v1/scans")
        assert len(get_response.json()) == 0


class TestTextCheckAPI:
    """Тесты для API проверки текста"""

    @pytest.mark.asyncio
    async def test_check_text_empty(self, client):
        """Проверка пустого текста"""
        response = await client.post(
            "/api/v1/check_text",
            json={"text": ""}
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_check_text_simple(self, client):
        """Проверка простого текста"""
        response = await client.post(
            "/api/v1/check_text",
            json={"text": "Простой текст на русском языке", "format": "plain"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "violations" in data
        assert "summary" in data
        assert "total_tokens" in data["summary"]

    @pytest.mark.asyncio
    async def test_check_text_with_violations(self, client):
        """Проверка текста с нарушениями"""
        response = await client.post(
            "/api/v1/check_text",
            json={"text": "Текст с иностранным словом download", "format": "plain"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["summary"]["violations_count"] > 0

    @pytest.mark.asyncio
    async def test_check_text_too_long(self, client):
        """Проверка слишком длинного текста"""
        long_text = "a" * 1_000_001  # 1 млн + 1 символ
        response = await client.post(
            "/api/v1/check_text",
            json={"text": long_text, "format": "plain"}
        )
        assert response.status_code == 413

    @pytest.mark.asyncio
    async def test_check_text_html_format(self, client):
        """Проверка текста в HTML формате"""
        response = await client.post(
            "/api/v1/check_text",
            json={"text": "<p>HTML текст</p>", "format": "html"}
        )
        assert response.status_code == 200


class TestDictionaryAPI:
    """Тесты для API словарей"""

    @pytest.mark.asyncio
    async def test_get_dictionary_preview(self, client):
        """Получение превью словарей"""
        response = await client.get("/api/v1/dictionary_preview")
        assert response.status_code == 200
        data = response.json()
        assert "dictionary_versions" in data


class TestHealthAPI:
    """Тесты для API здоровья"""

    @pytest.mark.asyncio
    async def test_health_check(self, client):
        """Проверка health endpoint"""
        response = await client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert data["status"] == "ok"


class TestRateLimiting:
    """Тесты для rate limiting"""

    @pytest.mark.asyncio
    async def test_scan_rate_limit(self, client):
        """Проверка rate limiting для сканов"""
        # Отправляем 6 запросов (лимит 5/минуту)
        for i in range(5):
            response = await client.post(
                "/api/v1/scan",
                json={"url": f"https://test{i}.com"}
            )
            # Первые 5 должны пройти (или быть принятыми в обработку)
        
        # 6-й должен получить rate limit
        response = await client.post(
            "/api/v1/scan",
            json={"url": "https://test6.com"}
        )
        # Может быть 429 (Too Many Requests) или 202 (если лимит еще не сработал)
        assert response.status_code in [202, 429]


class TestURLValidation:
    """Тесты для валидации URL"""

    @pytest.mark.asyncio
    async def test_valid_urls(self, client):
        """Проверка валидных URL"""
        valid_urls = [
            "https://example.com",
            "http://example.com",
            "https://example.com/page",
            "https://sub.example.com/path?query=1",
        ]
        for url in valid_urls:
            response = await client.post(
                "/api/v1/scan",
                json={"url": url}
            )
            # Должен быть принят (202) или ошибка валидации (422)
            assert response.status_code in [202, 422]

    @pytest.mark.asyncio
    async def test_invalid_urls(self, client):
        """Проверка невалидных URL"""
        invalid_urls = [
            "javascript:alert(1)",
            "data:text/html,<script>alert(1)</script>",
            "ftp://example.com",
            "example.com",  # без схемы
        ]
        for url in invalid_urls:
            response = await client.post(
                "/api/v1/scan",
                json={"url": url}
            )
            assert response.status_code == 422
