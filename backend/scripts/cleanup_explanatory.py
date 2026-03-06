
import asyncio
from app.database import AsyncSessionLocal
from app.models import DictionaryVersion, DictionaryWord
from sqlalchemy import delete, select

async def cleanup():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(DictionaryVersion).where(DictionaryVersion.name == "Explanatory"))
        versions = res.scalars().all()
        for v in versions:
            print(f"Deleting partial version: {v.name} {v.version}")
            await db.execute(delete(DictionaryWord).where(DictionaryWord.version == v.version, DictionaryWord.source_dictionary == v.name))
            await db.execute(delete(DictionaryVersion).where(DictionaryVersion.id == v.id))
        await db.commit()
        print("Cleanup done.")

if __name__ == "__main__":
    asyncio.run(cleanup())
