import asyncio
import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import create_async_engine
from app.models import Base, DictionaryVersion, DictionaryWord, Trademark
from app.config import settings

async def init_demo():
    print("Инициализация демо-базы (SQLite)...")
    engine = create_async_engine(settings.database_url)
    
    async with engine.begin() as conn:
        # Удаляем старое и создаем новое
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    
    from sqlalchemy.ext.asyncio import async_sessionmaker
    Session = async_sessionmaker(engine)
    
    async with Session() as session:
        # 1. Добавляем версию словаря
        ver_id = str(uuid.uuid4())
        dv = DictionaryVersion(
            id=ver_id,
            name="Orthographic",
            version="2024.1",
            pdf_path="/demo/dummy.pdf",
            processed_at=datetime.utcnow()
        )
        session.add(dv)
        
        # 2. Добавляем базовые русские слова (чтобы compliance не был 0)
        rus_words = ["батарея", "устройство", "смартфон", "поддерживает", "поездкой", "купил", "новый"]
        for w in rus_words:
            session.add(DictionaryWord(
                id=str(uuid.uuid4()),
                word=w,
                normal_form=w,
                part_of_speech="NOUN" if w != "купил" else "VERB",
                source_dictionary="Orthographic",
                version="2024.1"
            ))
            
        # 3. Добавляем "разрешенные" иностранные слова (напр. из словаря иностр. слов)
        allowed_foreign = ["bluetooth", "wi-fi"]
        for w in allowed_foreign:
            session.add(DictionaryWord(
                id=str(uuid.uuid4()),
                word=w,
                normal_form=w,
                part_of_speech="NOUN",
                source_dictionary="ForeignWords",
                is_foreign=True,
                version="2024.1"
            ))
            
        # 4. Добавляем Товарные знаки (исключения)
        session.add(Trademark(
            id=str(uuid.uuid4()),
            word="CoffeeMaster",
            normal_form="coffeemaster"
        ))
        
        await session.commit()
    
    print("Демо-данные загружены успешно!")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(init_demo())
