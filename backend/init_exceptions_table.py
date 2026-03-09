import asyncio
from sqlalchemy import text
from app.database import engine
from app.models import GlobalException

async def init_table():
    print("Checking connection to Supabase...")
    async with engine.begin() as conn:
        print("Creating table 'global_exceptions' if it doesn't exist...")
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS global_exceptions (
                id VARCHAR(36) PRIMARY KEY,
                word TEXT NOT NULL UNIQUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """))
        print("Table 'global_exceptions' created or already exists.")
        
        # Также добавим запись для проверки, если нужно (gmp)
        # await conn.execute(text("INSERT INTO global_exceptions (id, word) VALUES (:id, :word) ON CONFLICT (word) DO NOTHING"), 
        #                   {"id": "test-gmp", "word": "gmp"})

if __name__ == "__main__":
    asyncio.run(init_table())
