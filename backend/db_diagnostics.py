import asyncio
import sys
import os

# Add backend to path
sys.path.append(os.getcwd())

from app.database import engine, AsyncSessionLocal
from app.models import DictionaryVersion, DictionaryWord, Scan, Violation
from sqlalchemy import select, func

async def health_check():
    print("Starting Health Check...")
    try:
        async with AsyncSessionLocal() as session:
            # 1. Check DictionaryCount
            r_dicts = await session.execute(select(func.count(DictionaryVersion.id)))
            print(f"DictionaryVersion count: {r_dicts.scalar()}")
            
            # 2. Check DictionaryWord count
            r_words = await session.execute(select(func.count(DictionaryWord.id)))
            print(f"DictionaryWord count: {r_words.scalar()}")
            
            # 3. Check Scan count
            r_scans = await session.execute(select(func.count(Scan.id)))
            print(f"Scans count: {r_scans.scalar()}")
            
            # 4. Check if DictionaryVersions are empty or word_count is 0
            res_v = await session.execute(select(DictionaryVersion))
            versions = res_v.scalars().all()
            for v in versions:
                print(f"Dict: {v.name}, Real word_count in DB: {v.word_count}")

            # 5. Check if any Scan is stuck in 'started'
            r_active = await session.execute(select(Scan).where(Scan.status == 'started'))
            active = r_active.scalars().all()
            if active:
                print(f"Active scans: {len(active)}")
            else:
                print("No active scans found.")

    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    asyncio.run(health_check())
