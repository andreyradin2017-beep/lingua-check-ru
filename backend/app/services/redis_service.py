import json
import logging
from typing import Any, Optional
import redis.asyncio as redis
from app.config import settings

logger = logging.getLogger(__name__)

class RedisService:
    def __init__(self):
        self.redis_url = settings.redis_url
        self._redis: Optional[redis.Redis] = None

    async def connect(self):
        if not self._redis:
            try:
                self._redis = redis.from_url(self.redis_url, decode_responses=True)
                # Проверка соединения
                await self._redis.ping()
                logger.info(f"Connected to Redis at {self.redis_url}")
            except Exception as e:
                logger.error(f"Failed to connect to Redis: {e}")
                self._redis = None

    async def get(self, key: str) -> Optional[Any]:
        if not self._redis:
            await self.connect()
        if not self._redis:
            return None
        
        try:
            data = await self._redis.get(key)
            return json.loads(data) if data else None
        except Exception as e:
            logger.error(f"Redis get error for key {key}: {e}")
            return None

    async def set(self, key: str, value: Any, expire: int = 3600):
        if not self._redis:
            await self.connect()
        if not self._redis:
            return
        
        try:
            await self._redis.set(key, json.dumps(value), ex=expire)
        except Exception as e:
            logger.error(f"Redis set error for key {key}: {e}")

    async def delete(self, key: str):
        if not self._redis:
            await self.connect()
        if not self._redis:
            return
        
        try:
            await self._redis.delete(key)
        except Exception as e:
            logger.error(f"Redis delete error for key {key}: {e}")

    async def close(self):
        if self._redis:
            await self._redis.close()
            self._redis = None

redis_service = RedisService()
