import logging
import sys
import asyncio
import os

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import engine
from app.models import Base
from app.routers import health, scans, texts, dictionaries, trademarks

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting LinguaCheck-RU backend...")
    os.makedirs("static/screenshots", exist_ok=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables ensured.")
    yield
    logger.info("Shutting down LinguaCheck-RU backend...")
    await engine.dispose()


app = FastAPI(
    title="LinguaCheck-RU API",
    description="Система проверки соответствия русскому языку (ФЗ №168-ФЗ)",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Раздача скриншотов
app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(health.router, prefix="/api/v1", tags=["health"])
app.include_router(scans.router, prefix="/api/v1", tags=["scans"])
app.include_router(texts.router, prefix="/api/v1", tags=["texts"])
app.include_router(dictionaries.router, prefix="/api/v1", tags=["dictionaries"])
app.include_router(trademarks.router, prefix="/api/v1", tags=["trademarks"])
