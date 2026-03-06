from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check() -> dict:
    """specs/api.md — GET /api/v1/health"""
    return {"status": "healthy"}
