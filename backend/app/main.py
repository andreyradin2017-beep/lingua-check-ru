import logging
import sys
import asyncio
import os
from contextlib import asynccontextmanager
from typing import Callable

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.database import engine
from app.models import Base
from app.routers import health, scans, texts, dictionaries, trademarks, exceptions

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# Инициализация rate limiter
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting LinguaCheck-RU backend...")
    # Таблицы уже созданы в Supabase. Интроспекция (create_all)
    # через PgBouncer Transaction Mode приводит к ошибкам.
    logger.info("Database tables ensured (skipped DDL via pooler).")
    yield
    logger.info("Shutting down LinguaCheck-RU backend...")
    await engine.dispose()


app = FastAPI(
    title="LinguaCheck-RU API",
    description="Система проверки соответствия русскому языку (ФЗ №168-ФЗ)",
    version="0.1.0",
    lifespan=lifespan,
)

# Добавляем limiter в state приложения
app.state.limiter = limiter

# Обработчик превышения лимита
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Global error: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
    )

app.include_router(health.router, prefix="/api/v1", tags=["health"])
app.include_router(scans.router, prefix="/api/v1", tags=["scans"])
app.include_router(texts.router, prefix="/api/v1", tags=["texts"])
app.include_router(dictionaries.router, prefix="/api/v1", tags=["dictionaries"])
app.include_router(trademarks.router, prefix="/api/v1", tags=["trademarks"])
app.include_router(exceptions.router, prefix="/api/v1", tags=["exceptions"])
