import logging
import uuid
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.supabase_client import get_async_supabase

router = APIRouter()
logger = logging.getLogger(__name__)

class GlobalExceptionSchema(BaseModel):
    id: str
    word: str
    created_at: datetime

class GlobalExceptionCreate(BaseModel):
    word: str

@router.get("/exceptions", response_model=List[GlobalExceptionSchema])
async def get_exceptions():
    """Возвращает список всех глобальных исключений."""
    client = await get_async_supabase()
    resp = await client.table("global_exceptions").select("*").order("created_at", desc=True).execute()
    return resp.data

@router.post("/exceptions", response_model=GlobalExceptionSchema)
async def create_exception(data: GlobalExceptionCreate):
    """Добавляет новое глобальное исключение."""
    word = data.word.strip().lower()
    if not word:
        raise HTTPException(status_code=400, detail="Слово не может быть пустым")
    
    client = await get_async_supabase()
    
    # Проверяем на дубликаты
    check = await client.table("global_exceptions").select("id").eq("word", word).execute()
    if check.data:
        raise HTTPException(status_code=400, detail="Такое исключение уже существует")
    
    new_item = {
        "id": str(uuid.uuid4()),
        "word": word,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    resp = await client.table("global_exceptions").insert(new_item).execute()
    if not resp.data:
        raise HTTPException(status_code=500, detail="Ошибка при создании исключения")
    
    return resp.data[0]

@router.delete("/exceptions/{exception_id}")
async def delete_exception(exception_id: str):
    """Удаляет исключение по ID."""
    client = await get_async_supabase()
    resp = await client.table("global_exceptions").delete().eq("id", exception_id).execute()
    return {"status": "ok"}
