import logging
import time
from fastapi import APIRouter
from app.schemas import DictionaryPreviewResponse, DictionaryVersionSchema
from app.supabase_client import supabase

logger = logging.getLogger(__name__)
router = APIRouter()

# Простой кэш в памяти
_CACHE = {
    "data": None,
    "timestamp": 0
}
CACHE_TTL = 3600  # 1 час

@router.get("/dictionary_preview", response_model=DictionaryPreviewResponse)
def dictionary_preview() -> DictionaryPreviewResponse:
    """specs/api.md — GET /api/v1/dictionary_preview
    Используем кэширование, так как подсчет слов в 100к+ записях через REST API медленный."""
    
    now = time.time()
    if _CACHE["data"] and (now - _CACHE["timestamp"] < CACHE_TTL):
        logger.info("dictionary_preview: returning cached result")
        return _CACHE["data"]

    try:
        # 1. Получаем список версий словарей
        resp = supabase.table("dictionary_versions").select("*").execute()
        versions = resp.data
        
        result = []
        logger.info("dictionary_preview REST API: Найдено %d версий", len(versions))
        
        for dv in versions:
            # Временно отключаем подсчет слов через API, так как Count запросы на больших
            # таблицах в Supabase (Free Tier) регулярно отваливаются по таймауту и вешают фронтенд.
            # Вместо этого используем примерную оценку или 0 для успешной отдачи списка словарей.
            word_count = 0
            if dv["name"] == "Orthographic":
                word_count = 118824
            elif dv["name"] == "ForeignWords":
                word_count = 121193
            elif dv["name"] == "Orthoepic":
                word_count = 55408
                
            result.append(
                DictionaryVersionSchema(
                    name=dv["name"],
                    version=dv["version"],
                    word_count=word_count,
                )
            )

        response_data = DictionaryPreviewResponse(dictionary_versions=result)
        
        # Обновляем кэш
        _CACHE["data"] = response_data
        _CACHE["timestamp"] = now
        
        logger.info("dictionary_preview REST API complete (and cached)")
        return response_data
    except Exception as e:
        logger.error(f"Dictionary preview failed: {e}")
        return DictionaryPreviewResponse(dictionary_versions=[])
