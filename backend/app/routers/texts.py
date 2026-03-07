import logging

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.schemas import CheckTextRequest, CheckTextResponse, CheckTextSummary, ViolationSchema
from app.services.token_service import analyze_text

logger = logging.getLogger(__name__)
router = APIRouter()

ALLOWED_EXTENSIONS = {"txt", "docx", "pdf"}


@router.post("/check_text", response_model=CheckTextResponse)
async def check_text(
    body: CheckTextRequest,
) -> CheckTextResponse:
    """specs/api.md — POST /api/v1/check_text"""
    logger.info("check_text: %d символов, format=%s", len(body.text), body.format)
    result = await analyze_text(body.text)
    return result


@router.post("/check_text/upload", response_model=CheckTextResponse)
async def check_text_upload(
    file: UploadFile = File(...),
) -> CheckTextResponse:
    """Загрузка файла (TXT/DOCX/PDF) для проверки. specs/security.md."""
    # Валидация расширения
    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Неподдерживаемый формат. Разрешены: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Валидация размера (specs/security.md: max 10 МБ)
    content = await file.read()
    max_bytes = settings.max_file_size_mb * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"Файл превышает {settings.max_file_size_mb} МБ",
        )

    text = _extract_text(content, ext)
    if not text.strip():
        raise HTTPException(status_code=422, detail="Не удалось извлечь текст из файла")

    logger.info("check_text/upload: %s (%d байт), ext=%s", file.filename, len(content), ext)
    result = await analyze_text(text)
    return result


def _extract_text(content: bytes, ext: str) -> str:
    """Извлечение текста из файла."""
    if ext == "txt":
        return content.decode("utf-8", errors="replace")
    if ext == "docx":
        import io
        from docx import Document  # type: ignore

        doc = Document(io.BytesIO(content))
        return "\n".join(para.text for para in doc.paragraphs)
    if ext == "pdf":
        import io
        from pdfminer.high_level import extract_text as pdf_extract  # type: ignore

        return pdf_extract(io.BytesIO(content))
    return ""
