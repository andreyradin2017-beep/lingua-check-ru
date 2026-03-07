from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
import pymorphy3
from supabase import create_client, Client

from .. import schemas

router = APIRouter(prefix="/trademarks", tags=["trademarks"])
morph = pymorphy3.MorphAnalyzer()

# Инициализация Supabase REST API
SUPABASE_URL = "https://tefpshqwdlpzohcldayr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZnBzaHF3ZGxwem9oY2xkYXlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjgxODQyOSwiZXhwIjoyMDg4Mzk0NDI5fQ.y014Ojsi8d65faV_sazRa1ICW8f0UQNQugpPdn5bOvc"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

@router.get("", response_model=List[schemas.Trademark])
def get_trademarks():
    """Получить список всех зарегистрированных брендов."""
    resp = supabase.table("trademarks").select("*").execute()
    return resp.data

@router.post("", response_model=schemas.Trademark, status_code=status.HTTP_201_CREATED)
def create_trademark(trademark: schemas.TrademarkCreate):
    """Добавить новый бренд с автоматической нормализацией."""
    # Нормализация для поиска
    normal_form = morph.parse(trademark.word.lower())[0].normal_form
    
    # Проверка на дубликат (по нормальной форме)
    existing = supabase.table("trademarks").select("id").eq("normal_form", normal_form).execute()
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
    resp = supabase.table("trademarks").insert(data).execute()
    return resp.data[0]

@router.delete("/{trademark_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trademark(trademark_id: str):
    """Удалить бренд из списка исключений."""
    resp = supabase.table("trademarks").delete().eq("id", trademark_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Бренд не найден")
    return None
