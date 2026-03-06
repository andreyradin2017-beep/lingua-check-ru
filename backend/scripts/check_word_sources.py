
import asyncio
import io
import sys
from app.database import AsyncSessionLocal
from app.models import DictionaryWord
from sqlalchemy import select

async def main():
    words = ["диджитал", "маркетинг"]
    async with AsyncSessionLocal() as db:
        for w in words:
            res = await db.execute(select(DictionaryWord).where(DictionaryWord.normal_form == w))
            items = res.scalars().all()
            print(f"Word: {w}")
            for it in items:
                print(f"  Source: {it.source_dictionary}, Version: {it.version}")

if __name__ == "__main__":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    asyncio.run(main())
