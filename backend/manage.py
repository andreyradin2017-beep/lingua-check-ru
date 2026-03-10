import asyncio
import argparse
import sys
import logging
import os
from sqlalchemy import func, select
from app.database import engine, AsyncSessionLocal
from app.models import Base, DictionaryVersion, DictionaryWord
from app.supabase_client import get_async_supabase

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("manage")

async def init_db():
    """Инициализация таблиц базы данных."""
    logger.info("Initializing database tables...")
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database initialized.")
    except Exception as e:
        logger.error(f"Init DB failed: {e}")
        raise

async def seed_dictionaries():
    """Добавление метаданных словарей, если они отсутствуют."""
    logger.info("Seeding dictionary versions...")
    async with AsyncSessionLocal() as session:
        # Проверяем наличие записей
        result = await session.execute(select(DictionaryVersion))
        if result.scalars().first():
            logger.info("Dictionary versions already seeded.")
            return

        versions = [
            DictionaryVersion(name="Orthographic", version="2024", pdf_path="static/pdf/ortho.pdf"),
            DictionaryVersion(name="Orthoepic", version="2024", pdf_path="static/pdf/orthoepic.pdf"),
            DictionaryVersion(name="Explanatory", version="2024", pdf_path="static/pdf/expl.pdf"),
            DictionaryVersion(name="ForeignWords", version="2024", pdf_path="static/pdf/foreign.pdf"),
        ]
        session.add_all(versions)
        await session.commit()
    logger.info("Dictionary versions seeded.")

async def update_counts():
    """Обновление реального количества слов в DictionaryVersion."""
    logger.info("Updating dictionary word counts...")
    async with AsyncSessionLocal() as session:
        # Группируем DictionaryWord по source_dictionary и считаем
        stmt = select(
            DictionaryWord.source_dictionary, 
            func.count(DictionaryWord.id)
        ).group_by(DictionaryWord.source_dictionary)
        
        counts_res = await session.execute(stmt)
        for name, count in counts_res.all():
            logger.info(f"Dict {name}: {count} words")
            # Находим заголовок словаря и обновляем
            upd_stmt = select(DictionaryVersion).where(DictionaryVersion.name == name)
            dv_res = await session.execute(upd_stmt)
            dv = dv_res.scalar_one_or_none()
            if dv:
                dv.word_count = count
        
        await session.commit()
    logger.info("Counts update complete.")

async def run_cmd():
    parser = argparse.ArgumentParser(description="LinguaCheck-RU Management Tool")
    parser.add_argument("cmd", choices=["init", "seed", "update-counts"], help="Command to run")
    args = parser.parse_args()

    try:
        if args.cmd == "init":
            await init_db()
        elif args.cmd == "seed":
            await seed_dictionaries()
        elif args.cmd == "update-counts":
            await update_counts()
    except Exception as e:
        logger.error(f"Command failed: {e}")
    finally:
        await engine.dispose()
        logger.info("Connections disposed.")

def main():
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    
    asyncio.run(run_cmd())

if __name__ == "__main__":
    main()
