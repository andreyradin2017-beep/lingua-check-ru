import json
import logging
from typing import Any, Optional
import redis.asyncio as redis
from app.config import settings

logger = logging.getLogger(__name__)

class RedisService:
    """
    Redis-кэш с graceful fallback.
    Если Redis недоступен (FREE тариф Render), работает без кэша.
    Ошибки подключения логируются один раз на уровне WARNING, не ERROR.
    """
    def __init__(self):
        self.redis_url = settings.redis_url
        self._redis: Optional[redis.Redis] = None
        self._unavailable: bool = False  # Флаг: Redis недоступен, не пробуем снова

    async def connect(self):
        if self._unavailable:
            return  # Уже знаем что Redis нет — не спамим ошибками
        if self._redis:
            return
        try:
            self._redis = redis.from_url(self.redis_url, decode_responses=True, socket_connect_timeout=2)
            await self._redis.ping()
            logger.info(f"Connected to Redis at {self.redis_url}")
        except Exception as e:
            logger.warning(f"Redis недоступен (fallback без кэша): {e}")
            self._redis = None
            self._unavailable = True  # Не пробуем подключиться снова в этой сессии

    async def get(self, key: str) -> Optional[Any]:
        if self._unavailable:
            return None
        if not self._redis:
            await self.connect()
        if not self._redis:
            return None
        try:
            data = await self._redis.get(key)
            return json.loads(data) if data else None
        except Exception as e:
            logger.debug(f"Redis get error for key {key}: {e}")
            return None

    async def set(self, key: str, value: Any, expire: int = 3600):
        if self._unavailable:
            return
        if not self._redis:
            await self.connect()
        if not self._redis:
            return
        try:
            await self._redis.set(key, json.dumps(value), ex=expire)
        except Exception as e:
            logger.debug(f"Redis set error for key {key}: {e}")

    async def delete(self, key: str):
        if self._unavailable:
            return
        if not self._redis:
            await self.connect()
        if not self._redis:
            return
        try:
            await self._redis.delete(key)
        except Exception as e:
            logger.debug(f"Redis delete error for key {key}: {e}")

    async def close(self):
        if self._redis:
            await self._redis.close()
            self._redis = None

redis_service = RedisService()
