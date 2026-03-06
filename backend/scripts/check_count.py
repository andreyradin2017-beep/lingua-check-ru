import asyncio
from app.database import AsyncSessionLocal
from sqlalchemy import select, func
from app.models import DictionaryWord

async def main():
    async with AsyncSessionLocal() as db:
        count = await db.scalar(select(func.count(DictionaryWord.id)))
        print(f"Total words: {count}")

if __name__ == "__main__":
    asyncio.run(main())
