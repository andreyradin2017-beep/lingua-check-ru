from fastapi import APIRouter
from app.supabase_client import get_async_supabase

router = APIRouter()


@router.get("/health")
async def health_check():
    """Проверка работоспособности API и соеденения с БД."""
    try:
        # Проверяем связь через REST
        client = await get_async_supabase()
        await client.table("dictionary_words").select("count", count="exact").limit(1).execute()
        db_status = "ok"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "ok",
        "database": db_status,
        "mode": "rest_api"
    }
