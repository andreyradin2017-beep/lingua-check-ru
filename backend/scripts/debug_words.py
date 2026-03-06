
import asyncio
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models import DictionaryWord

async def check_words():
    words = ["диджитал", "маркетинг", "компьютер", "солнышко"]
    async with AsyncSessionLocal() as db:
        for word in words:
            # Check exact word
            res = await db.execute(select(DictionaryWord).where(DictionaryWord.normal_form == word))
            found = res.scalars().all()
            if found:
                print(f"Word '{word}' found {len(found)} times. Sources: {[f.source_dictionary for f in found]}")
            else:
                print(f"Word '{word}' NOT found")

if __name__ == "__main__":
    asyncio.run(check_words())
