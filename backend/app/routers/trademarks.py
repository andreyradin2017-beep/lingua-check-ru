import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
import pymorphy3

from .. import schemas
from app.supabase_client import get_async_supabase

router = APIRouter(prefix="/trademarks", tags=["trademarks"])
morph = pymorphy3.MorphAnalyzer()

@router.get("", response_model=List[schemas.Trademark])
async def get_trademarks():
    """Получить список всех зарегистрированных брендов."""
    client = await get_async_supabase()
    resp = await client.table("trademarks").select("*").execute()
    return resp.data

@router.post("", response_model=schemas.Trademark, status_code=status.HTTP_201_CREATED)
async def create_trademark(trademark: schemas.TrademarkCreate):
    """Добавить новый бренд с автоматической нормализацией."""
    # Валидация слова
    word = trademark.word.strip()
    if not word:
        raise HTTPException(
            status_code=400,
            detail="Слово не может быть пустым"
        )
    
    # Нормализация для поиска с обработкой ошибок
    try:
        normal_form = morph.parse(word.lower())[0].normal_form
    except Exception as e:
        # Если pymorphy3 падает, используем слово в нижнем регистре
        normal_form = word.lower()
    
    client = await get_async_supabase()
    # Проверка на дубликат (по нормальной форме)
    existing = await client.table("trademarks").select("id").eq("normal_form", normal_form).execute()
    if existing.data:
        raise HTTPException(
            status_code=400,
            detail=f"Бренд '{word}' уже зарегистрирован (нормальная форма: {normal_form})"
        )

    # Вставка в БД через REST API
    data = {
        "id": str(uuid.uuid4()),  # Генерируем UUID
        "word": word,
        "normal_form": normal_form
    }
    try:
        resp = await client.table("trademarks").insert(data).execute()
        return resp.data[0]
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при добавлении бренда: {str(e)}"
        )

@router.delete("/{trademark_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_trademark(trademark_id: str):
    """Удалить бренд из списка исключений."""
    client = await get_async_supabase()
    resp = await client.table("trademarks").delete().eq("id", trademark_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Бренд не найден")
    return None
