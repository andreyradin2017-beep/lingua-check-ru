import logging

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings

import sqlalchemy

logger = logging.getLogger(__name__)

from sqlalchemy.pool import NullPool, QueuePool

connect_args = {}
if "sqlite" in settings.database_url:
    connect_args["check_same_thread"] = False
elif "postgresql" in settings.database_url:
    connect_args["prepared_statement_cache_size"] = 0
    connect_args["statement_cache_size"] = 0

engine = create_async_engine(
    settings.database_url,
    echo=False,
    connect_args=connect_args,
    poolclass=NullPool,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncSession:  # type: ignore[return]
    """Dependency: async DB session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
