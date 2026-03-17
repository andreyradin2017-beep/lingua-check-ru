"""
Unit тесты для API endpoints с полными моками
Все внешние зависимости замокированы - тесты работают без сети и БД
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.fixture
async def client():
    """Тестовый клиент для локальных тестов"""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        timeout=30.0
    ) as ac:
        yield ac


class TestTrademarksAPI:
    """Тесты для API брендов"""

    @pytest.mark.asyncio
    async def test_get_trademarks_empty(self, client, mock_supabase_client):
        """Получение пустого списка брендов"""
        mock_supabase_client.table.return_value.select.return_value.execute.return_value.data = []
        
        response = await client.get("/api/v1/trademarks")
        
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    @pytest.mark.asyncio
    async def test_create_trademark(self, client, mock_supabase_client):
        """Создание нового бренда"""
        trademark_data = {
            "id": "test-id-123",
            "word": "TestBrand",
            "normal_form": "testbrand",
            "created_at": "2026-03-11T00:00:00Z"
        }
        
        # Мокируем проверку на дубликат (пусто) и успешное создание
        mock_supabase_client.table.return_value.select.return_value.execute.return_value.data = []
        mock_supabase_client.table.return_value.insert.return_value.execute.return_value.data = [trademark_data]
        
        response = await client.post(
            "/api/v1/trademarks",
            json={"word": "TestBrand"}
        )
        
        assert response.status_code in [200, 201]
        data = response.json()
        assert data["word"] == "TestBrand"
        assert "normal_form" in data
        assert "id" in data

    @pytest.mark.asyncio
    async def test_create_duplicate_trademark(self, client, mock_supabase_client):
        """Попытка создания дубликата бренда"""
        # Мокируем существующий бренд
        mock_supabase_client.table.return_value.select.return_value.execute.return_value.data = [
            {"id": "existing-id", "normal_form": "duplicatebrand"}
        ]
        
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
        # Pydantic валидация возвращает 422
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_delete_trademark(self, client, mock_supabase_client):
        """Удаление бренда"""
        trademark_id = "test-trademark-123"
        
        # Мокируем успешное удаление
        mock_supabase_client.table.return_value.delete.return_value.eq.return_value.execute.return_value.data = [
            {"id": trademark_id}
        ]
        
        delete_response = await client.delete(f"/api/v1/trademarks/{trademark_id}")
        
        assert delete_response.status_code == 204

    @pytest.mark.asyncio
    async def test_delete_nonexistent_trademark(self, client, mock_supabase_client):
        """Удаление несуществующего бренда"""
        # Мокируем отсутствие бренда
        mock_supabase_client.table.return_value.delete.return_value.eq.return_value.execute.return_value.data = []
        
        response = await client.delete("/api/v1/trademarks/nonexistent-id")
        
        assert response.status_code == 404


class TestExceptionsAPI:
    """Тесты для API глобальных исключений"""

    @pytest.mark.asyncio
    async def test_get_exceptions_empty(self, client, mock_supabase_client):
        """Получение пустого списка исключений"""
        mock_supabase_client.table.return_value.select.return_value.execute.return_value.data = []
        
        response = await client.get("/api/v1/exceptions")
        
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    @pytest.mark.asyncio
    async def test_create_exception(self, client, mock_supabase_client):
        """Создание нового исключения"""
        exception_data = {
            "id": "test-id-123",
            "word": "testexception",
            "created_at": "2026-03-11T00:00:00Z"
        }
        
        # Мокируем проверку на дубликат (пусто) и успешное создание
        mock_supabase_client.table.return_value.select.return_value.execute.return_value.data = []
        mock_supabase_client.table.return_value.insert.return_value.execute.return_value.data = [exception_data]
        
        response = await client.post(
            "/api/v1/exceptions",
            json={"word": "testexception"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["word"] == "testexception"
        assert "id" in data

    @pytest.mark.asyncio
    async def test_create_duplicate_exception(self, client, mock_supabase_client):
        """Попытка создания дубликата исключения"""
        # Мокируем существующее исключение
        mock_supabase_client.table.return_value.select.return_value.execute.return_value.data = [
            {"id": "existing-id", "word": "uniqueexception"}
        ]
        
        response = await client.post(
            "/api/v1/exceptions",
            json={"word": "uniqueexception"}
        )
        
        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_delete_exception(self, client, mock_supabase_client):
        """Удаление исключения"""
        exception_id = "test-exception-123"
        
        # Мокируем успешное удаление
        mock_supabase_client.table.return_value.delete.return_value.eq.return_value.execute.return_value.data = [
            {"id": exception_id}
        ]
        
        delete_response = await client.delete(f"/api/v1/exceptions/{exception_id}")
        
        assert delete_response.status_code in [200, 204]


class TestScanAPI:
    """Тесты для API сканирования"""

    @pytest.mark.asyncio
    async def test_create_scan_invalid_url(self, client):
        """Создание скана с невалидным URL"""
        response = await client.post(
            "/api/v1/scan",
            json={"url": "not-a-url"}
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_create_scan_missing_url(self, client):
        """Создание скана без URL"""
        response = await client.post(
            "/api/v1/scan",
            json={}
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_get_nonexistent_scan(self, client, mock_supabase_client):
        """Получение несуществующего скана"""
        mock_supabase_client.table.return_value.select.return_value.execute.return_value.data = []
        
        response = await client.get("/api/v1/scan/nonexistent-id")
        
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_scans_list(self, client, mock_supabase_client):
        """Получение списка сканов"""
        mock_supabase_client.table.return_value.select.return_value.execute.return_value.data = []
        
        response = await client.get("/api/v1/scans")
        
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    @pytest.mark.asyncio
    async def test_delete_nonexistent_scan(self, client, mock_supabase_client):
        """Удаление несуществующего скана"""
        # API возвращает 404 или 500
        mock_supabase_client.table.return_value.select.return_value.execute.return_value.data = []
        
        response = await client.delete("/api/v1/scan/nonexistent-id")
        
        assert response.status_code in [404, 500]


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
    async def test_check_text_simple(self, client, mock_supabase_client):
        """Проверка простого текста"""
        mock_supabase_client.table.return_value.select.return_value.execute.return_value.data = []
        
        response = await client.post(
            "/api/v1/check_text",
            json={"text": "Простой текст на русском языке", "format": "plain"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "violations" in data
        assert "summary" in data


class TestHealthAPI:
    """Тесты для API здоровья"""

    @pytest.mark.asyncio
    async def test_health_check(self, client, mock_supabase_client):
        """Проверка health endpoint"""
        mock_supabase_client.table.return_value.select.return_value.execute.return_value.data = []
        
        response = await client.get("/api/v1/health")
        
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
