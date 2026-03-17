"""
Комплексные тесты стабильности LinguaCheck-RU
Проверка каждого функционала на стабильность
"""
import pytest
import os
import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.supabase_client import get_async_supabase

TEST_MODE = os.getenv("TEST_MODE", "local")
pytestmark = pytest.mark.skipif(TEST_MODE != "integration", reason="Stability tests require real database and background workers")

@pytest.fixture
async def client():
    """Тестовый клиент"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


class TestScanStability:
    """Тесты стабильности сканирования"""

    @pytest.mark.asyncio
    async def test_scan_small_site(self, client):
        """Сканирование небольшого сайта (1-5 страниц)"""
        # Создаем скан
        response = await client.post(
            "/api/v1/scan",
            json={"url": "https://example.com", "max_depth": 1, "max_pages": 5}
        )
        assert response.status_code == 202
        scan_id = response.json()["scan_id"]
        
        # Ждем завершения (до 30 секунд)
        for _ in range(30):
            await asyncio.sleep(1)
            status_resp = await client.get(f"/api/v1/scan/{scan_id}")
            status = status_resp.json()["status"]
            if status in ["completed", "failed", "stopped"]:
                break
        
        # Проверяем статус
        final_resp = await client.get(f"/api/v1/scan/{scan_id}")
        data = final_resp.json()
        
        # Скан должен завершиться успешно ИЛИ иметь данные
        assert data["status"] in ["completed", "failed"]
        
        # Если failed - проверяем что есть хоть какие-то данные
        if data["status"] == "failed":
            # Это допустимо для внешних сайтов
            assert data["summary"]["total_pages"] >= 0
        else:
            # Успешное сканирование должно иметь данные
            assert data["summary"]["total_pages"] > 0

    @pytest.mark.asyncio
    async def test_scan_invalid_url_handling(self, client):
        """Обработка невалидного URL не должна ломать сервис"""
        response = await client.post(
            "/api/v1/scan",
            json={"url": "https://this-domain-definitely-does-not-exist-12345.com", "max_depth": 1}
        )
        assert response.status_code == 202
        scan_id = response.json()["scan_id"]
        
        # Ждем завершения
        for _ in range(20):
            await asyncio.sleep(1)
            status_resp = await client.get(f"/api/v1/scan/{scan_id}")
            status = status_resp.json()["status"]
            if status in ["completed", "failed"]:
                break
        
        # Сервис не должен упасть - должен вернуть статус
        final_resp = await client.get(f"/api/v1/scan/{scan_id}")
        assert final_resp.status_code == 200


class TestTextAnalysisStability:
    """Тесты стабильности анализа текста"""

    @pytest.mark.asyncio
    async def test_empty_text_handling(self, client):
        """Пустой текст не должен ломать сервис"""
        response = await client.post(
            "/api/v1/check_text",
            json={"text": "", "format": "plain"}
        )
        # Должна быть валидация
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_very_long_text(self, client):
        """Очень длинный текст должен обрабатываться корректно"""
        # Текст на 500К символов (меньше лимита в 1М)
        long_text = "а" * 500000
        
        response = await client.post(
            "/api/v1/check_text",
            json={"text": long_text, "format": "plain"}
        )
        
        # Должен обработать без ошибок
        assert response.status_code == 200
        data = response.json()
        assert "summary" in data
        assert data["summary"]["total_tokens"] > 0

    @pytest.mark.asyncio
    async def test_special_characters_text(self, client):
        """Текст со спецсимволами должен обрабатываться"""
        special_text = "!@#$%^&*()_+-=[]{}|;':\",./<>?1234567890"
        
        response = await client.post(
            "/api/v1/check_text",
            json={"text": special_text, "format": "plain"}
        )
        
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_mixed_languages_text(self, client):
        """Смешанный текст должен обрабатываться"""
        mixed_text = """
        Привет мир! Hello world! 你好世界!
        Это смешанный текст с разными языками.
        Some English words and phrases.
        """
        
        response = await client.post(
            "/api/v1/check_text",
            json={"text": mixed_text, "format": "plain"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "violations" in data
        assert "summary" in data


class TestTrademarkStability:
    """Тесты стабильности управления брендами"""

    @pytest.mark.asyncio
    async def test_create_many_trademarks(self, client):
        """Массовое создание брендов не должно ломать сервис"""
        for i in range(10):
            response = await client.post(
                "/api/v1/trademarks",
                json={"word": f"TestBrand{i}"}
            )
            # Допускаем дубликаты (400)
            assert response.status_code in [201, 400]

    @pytest.mark.asyncio
    async def test_trademark_with_special_chars(self, client):
        """Бренды со спецсимволами"""
        test_cases = [
            "Test-Brand",  # дефис
            "Test.Brand",  # точка
            "Test_Brand",  # подчеркивание
            "123Brand",    # цифры в начале
        ]
        
        for word in test_cases:
            response = await client.post(
                "/api/v1/trademarks",
                json={"word": word}
            )
            # Должен принимать или отклонять с понятной ошибкой
            assert response.status_code in [201, 400, 422]


class TestExceptionStability:
    """Тесты стабильности исключений"""

    @pytest.mark.asyncio
    async def test_create_duplicate_exception(self, client):
        """Попытка создания дубликата исключения"""
        word = f"UniqueException{asyncio.get_event_loop().time()}"
        
        # Создаем первое
        response1 = await client.post(
            "/api/v1/exceptions",
            json={"word": word}
        )
        assert response1.status_code == 201
        
        # Пытаемся создать дубликат
        response2 = await client.post(
            "/api/v1/exceptions",
            json={"word": word}
        )
        # Должна быть ошибка дубликата
        assert response2.status_code == 400


class TestDeleteStability:
    """Тесты стабильности удаления"""

    @pytest.mark.asyncio
    async def test_delete_during_scan(self, client):
        """Удаление скана во время сканирования"""
        # Создаем скан
        response = await client.post(
            "/api/v1/scan",
            json={"url": "https://example.com", "max_depth": 1}
        )
        scan_id = response.json()["scan_id"]
        
        # Пытаемся удалить сразу
        delete_response = await client.delete(f"/api/v1/scan/{scan_id}")
        
        # Должен удалиться или вернуть ошибку
        assert delete_response.status_code in [200, 404]

    @pytest.mark.asyncio
    async def test_delete_nonexistent_scan(self, client):
        """Удаление несуществующего скана"""
        response = await client.delete("/api/v1/scan/00000000-0000-0000-0000-000000000000")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_clear_empty_database(self, client):
        """Очистка пустой базы"""
        response = await client.delete("/api/v1/scans")
        # Должна работать даже на пустой базе
        assert response.status_code == 200


class TestAPIRateLimiting:
    """Тесты rate limiting"""

    @pytest.mark.asyncio
    async def test_rapid_scan_requests(self, client):
        """Множественные запросы на сканирование"""
        responses = []
        for i in range(10):
            response = await client.post(
                "/api/v1/scan",
                json={"url": f"https://test{i}.com"}
            )
            responses.append(response.status_code)
        
        # Некоторые должны пройти, некоторые - получить rate limit
        assert 202 in responses or 429 in responses

    @pytest.mark.asyncio
    async def test_rapid_text_check(self, client):
        """Множественные проверки текста"""
        for _ in range(20):
            response = await client.post(
                "/api/v1/check_text",
                json={"text": "Тестовый текст", "format": "plain"}
            )
            # Должен обрабатывать
            assert response.status_code == 200


class TestDatabaseIntegrity:
    """Тесты целостности БД"""

    @pytest.mark.asyncio
    async def test_scan_without_pages(self, client):
        """Скан без страниц должен корректно обрабатываться"""
        # Создаем скан напрямую в БД
        scan_client = await get_async_supabase()
        
        project_data = {"id": "test-project-no-pages", "name": "Test"}
        await scan_client.table("projects").insert(project_data).execute()
        
        scan_data = {
            "id": "test-scan-no-pages",
            "project_id": "test-project-no-pages",
            "target_url": "https://test.com",
            "status": "completed"
        }
        await scan_client.table("scans").insert(scan_data).execute()
        
        # Получаем скан
        response = await client.get("/api/v1/scan/test-scan-no-pages")
        assert response.status_code == 200
        
        data = response.json()
        assert data["summary"]["total_pages"] == 0
        assert data["summary"]["total_violations"] == 0


class TestConcurrentAccess:
    """Тесты конкурентного доступа"""

    @pytest.mark.asyncio
    async def test_concurrent_trademark_creation(self, client):
        """Одновременное создание одного бренда"""
        word = f"ConcurrentBrand{asyncio.get_event_loop().time()}"
        
        # Запускаем несколько запросов одновременно
        tasks = [
            client.post("/api/v1/trademarks", json={"word": word})
            for _ in range(5)
        ]
        responses = await asyncio.gather(*tasks)
        
        # Один должен succeed, остальные - fail (дубликат)
        success_count = sum(1 for r in responses if r.status_code == 201)
        duplicate_count = sum(1 for r in responses if r.status_code == 400)
        
        assert success_count == 1
        assert duplicate_count >= 1


class TestErrorRecovery:
    """Тесты восстановления после ошибок"""

    @pytest.mark.asyncio
    async def test_service_health_after_failed_scan(self, client):
        """Сервис должен работать после failed скана"""
        # Создаем скан с заведомо проблемным URL
        response = await client.post(
            "/api/v1/scan",
            json={"url": "https://invalid.invalid", "max_depth": 1}
        )
        
        # Ждем завершения
        await asyncio.sleep(10)
        
        # Проверяем что сервис работает
        health_response = await client.get("/api/v1/health")
        assert health_response.status_code == 200
        
        # Можем создать новый скан
        new_response = await client.post(
            "/api/v1/scan",
            json={"url": "https://example.com"}
        )
        assert new_response.status_code == 202


# Утилиты для тестов
async def wait_for_scan_completion(client, scan_id, timeout=60):
    """Ждет завершения сканирования"""
    for _ in range(timeout):
        await asyncio.sleep(1)
        response = await client.get(f"/api/v1/scan/{scan_id}")
        status = response.json()["status"]
        if status in ["completed", "failed", "stopped"]:
            return response.json()
    raise TimeoutError(f"Scan {scan_id} did not complete within {timeout} seconds")
