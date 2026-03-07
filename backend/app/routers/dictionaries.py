import logging

from fastapi import APIRouter
from supabase import create_client, Client

from app.schemas import DictionaryPreviewResponse, DictionaryVersionSchema

logger = logging.getLogger(__name__)
router = APIRouter()

SUPABASE_URL = "https://tefpshqwdlpzohcldayr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZnBzaHF3ZGxwem9oY2xkYXlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjgxODQyOSwiZXhwIjoyMDg4Mzk0NDI5fQ.y014Ojsi8d65faV_sazRa1ICW8f0UQNQugpPdn5bOvc"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

@router.get("/dictionary_preview", response_model=DictionaryPreviewResponse)
def dictionary_preview() -> DictionaryPreviewResponse:
    """specs/api.md — GET /api/v1/dictionary_preview
    Используем REST API напрямую для обхода проблем с asyncpg на Windows и долгих count запросов."""
    
    # 1. Получаем список версий словарей
    resp = supabase.table("dictionary_versions").select("*").execute()
    versions = resp.data
    
    result = []
    logger.info("dictionary_preview REST API: Найдено %d версий", len(versions))
    
    for dv in versions:
        # 2. Получаем кол-во слов через эффективный exact count встроенный в Supabase API
        count_resp = supabase.table("dictionary_words")\
            .select("id", count="exact")\
            .eq("version", dv["version"])\
            .eq("source_dictionary", dv["name"])\
            .limit(1)\
            .execute()
            
        word_count = count_resp.count if count_resp.count is not None else 0
        
        result.append(
            DictionaryVersionSchema(
                name=dv["name"],
                version=dv["version"],
                word_count=word_count,
            )
        )

    logger.info("dictionary_preview REST API complete")
    return DictionaryPreviewResponse(dictionary_versions=result)
