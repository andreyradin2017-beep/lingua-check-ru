import asyncio
import sys
import os
from sqlalchemy import text

# Add backend to path
sys.path.append(os.getcwd())

from app.database import engine

async def fix_schema():
    print("Checking database schema...")
    async with engine.begin() as conn:
        # 1. Add word_count to dictionary_versions if missing
        try:
            print("Trying to add word_count column to dictionary_versions...")
            await conn.execute(text("ALTER TABLE dictionary_versions ADD COLUMN IF NOT EXISTS word_count BIGINT DEFAULT 0"))
            print("Successfully checked/added word_count column.")
        except Exception as e:
            print(f"Error adding word_count: {e}")

        # 2. Check if violations/tokens tables need indices for faster deletion
        try:
            print("Adding indices for faster deletion...")
            await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_violations_page_id ON violations(page_id)"))
            await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_tokens_page_id ON tokens(page_id)"))
            print("Indices checked.")
        except Exception as e:
            print(f"Error adding indices: {e}")

    print("Schema fix complete.")
    await engine.dispose()

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    asyncio.run(fix_schema())
