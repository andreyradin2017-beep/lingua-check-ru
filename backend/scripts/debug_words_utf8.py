
import asyncio
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models import DictionaryWord

async def check_words():
    words = ["диджитал", "маркетинг", "компьютер", "солнышко"]
    async with AsyncSessionLocal() as db:
        for word in words:
            res = await db.execute(select(DictionaryWord).where(DictionaryWord.normal_form == word))
            found = res.scalars().all()
            if found:
                print(f"Found {word}: {len(found)} results. Sources: {[f.source_dictionary for f in found]}")
            else:
                print(f"NOT Found {word}")

if __name__ == "__main__":
    import sys
    import io
    # Force UTF-8 for stdout
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    asyncio.run(check_words())
