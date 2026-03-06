import logging

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import DictionaryVersion, DictionaryWord
from app.schemas import DictionaryPreviewResponse, DictionaryVersionSchema

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/dictionary_preview", response_model=DictionaryPreviewResponse)
async def dictionary_preview(
    db: AsyncSession = Depends(get_db),
) -> DictionaryPreviewResponse:
    """specs/api.md — GET /api/v1/dictionary_preview"""
    versions_result = await db.execute(select(DictionaryVersion))
    versions = versions_result.scalars().all()

    result = []
    for dv in versions:
        count_result = await db.execute(
            select(func.count(DictionaryWord.id)).where(
                DictionaryWord.version == dv.version,
                DictionaryWord.source_dictionary == dv.name,
            )
        )
        word_count = count_result.scalar() or 0
        result.append(
            DictionaryVersionSchema(
                name=dv.name,
                version=dv.version,
                word_count=word_count,
            )
        )

    logger.info("dictionary_preview: %d словарей", len(result))
    return DictionaryPreviewResponse(dictionary_versions=result)
