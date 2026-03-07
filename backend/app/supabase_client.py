import asyncio
import logging
from supabase import create_client, create_async_client, Client, AsyncClient, ClientOptions
from app.config import settings

logger = logging.getLogger(__name__)

# Общие настройки с увеличенным таймаутом
# По умолчанию httpx использует 5 секунд, что мало для батчей
_OPTIONS = ClientOptions(postgrest_client_timeout=60)

# Синхронный клиент
supabase: Client = create_client(settings.supabase_url, settings.supabase_key, options=_OPTIONS)

async def get_async_supabase() -> AsyncClient:
    """Возвращает новый асинхронный клиент для использования в текущем event loop."""
    return await create_async_client(settings.supabase_url, settings.supabase_key, options=_OPTIONS)

async def supabase_execute_with_retry(table_name: str, method: str, data: dict = None, filters: dict = None, retries: int = 3):
    """
    Выполняет операцию через Async REST API с повторными попытками.
    Это помогает при RemoteProtocolError (Server disconnected).
    """
    last_exc = None
    # Создаем клиент локально для операции, чтобы избежать проблем с shared connections в разных потоках
    client = await get_async_supabase()
    
    try:
        for i in range(retries):
            try:
                query = client.table(table_name)
                
                if method == "insert":
                    # insert(data)
                    return await query.insert(data).execute()
                elif method == "update":
                    # update(data).eq(filters)
                    q = query.update(data)
                    for k, v in (filters or {}).items():
                        q = q.eq(k, v)
                    return await q.execute()
                elif method == "select":
                    q = query.select(data or "*")
                    for k, v in (filters or {}).items():
                        q = q.eq(k, v)
                    return await q.execute()
                # Другие методы можно добавить по мере надобности
                
            except Exception as e:
                last_exc = e
                logger.warning(f"Supabase {method} to {table_name} failed (attempt {i+1}): {e}")
                await asyncio.sleep(1 * (i + 1))
        
        logger.error(f"Supabase {method} to {table_name} failed after {retries} retries: {last_exc}")
        raise last_exc
    finally:
        # У AsyncClient нет явного close() в некоторых версиях, 
        # но в httpx (который под капотом) он есть. 
        # PostgrestClient в supabase-py инкапсулирует его.
        pass
