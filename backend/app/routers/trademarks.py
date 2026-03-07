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
    # Нормализация для поиска
    normal_form = morph.parse(trademark.word.lower())[0].normal_form
    
    client = await get_async_supabase()
    # Проверка на дубликат (по нормальной форме)
    existing = await client.table("trademarks").select("id").eq("normal_form", normal_form).execute()
    if existing.data:
        raise HTTPException(
            status_code=400,
            detail=f"Бренд '{trademark.word}' уже зарегистрирован (нормальная форма: {normal_form})"
        )

    # Вставка в БД через REST API
    data = {
        "word": trademark.word,
        "normal_form": normal_form
    }
    resp = await client.table("trademarks").insert(data).execute()
    return resp.data[0]

@router.delete("/{trademark_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_trademark(trademark_id: str):
    """Удалить бренд из списка исключений."""
    client = await get_async_supabase()
    resp = await client.table("trademarks").delete().eq("id", trademark_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Бренд не найден")
    return None
