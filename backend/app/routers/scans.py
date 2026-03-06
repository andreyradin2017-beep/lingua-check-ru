import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Page, Project, Scan, Violation
from app.schemas import (
    PageSchema,
    ScanStartRequest,
    ScanStartResponse,
    ScanStatusResponse,
    ScanSummary,
    ViolationSchema,
    ScanHistoryItem,
)
from app.services.scan_service import start_scan_background

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/scan", response_model=ScanStartResponse, status_code=202)
async def create_scan(
    body: ScanStartRequest,
    db: AsyncSession = Depends(get_db),
) -> ScanStartResponse:
    """
    specs/api.md — POST /api/v1/scan
    Запускает сканирование сайта в фоновом режиме.
    """
    # Создаём проект и скан в БД
    project = Project(id=str(uuid.uuid4()), name=body.url)
    db.add(project)
    await db.flush()

    scan = Scan(
        id=str(uuid.uuid4()),
        project_id=project.id,
        target_url=body.url,
        status="started",
        max_depth=body.max_depth,
        max_pages=body.max_pages,
    )
    db.add(scan)
    await db.flush()
    await db.commit()

    scan_id = scan.id
    logger.info("Scan %s created for URL %s", scan_id, body.url)

    # Запуск в фоне (asyncio.create_task внутри)
    await start_scan_background(
        scan_id, 
        body.url, 
        body.max_depth, 
        body.max_pages, 
        body.capture_screenshots
    )

    return ScanStartResponse(scan_id=scan_id, status="started")


@router.get("/scans", response_model=list[ScanHistoryItem])
async def get_scans(db: AsyncSession = Depends(get_db)) -> list[ScanHistoryItem]:
    """Возвращает историю сканирований от новых к старым."""
    result = await db.execute(select(Scan).order_by(Scan.started_at.desc()).limit(100))
    return result.scalars().all()


@router.get("/scan/{scan_id}", response_model=ScanStatusResponse)
async def get_scan(
    scan_id: str,
    db: AsyncSession = Depends(get_db),
) -> ScanStatusResponse:
    """specs/api.md — GET /api/v1/scan/{scan_id}"""
    scan = await db.get(Scan, scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Скан не найден")

    # Получаем страницы
    pages_result = await db.execute(select(Page).where(Page.scan_id == scan_id))
    pages = pages_result.scalars().all()

    # Получаем нарушения по page_id
    page_ids = [p.id for p in pages]
    violations_result = await db.execute(
        select(Violation).where(Violation.page_id.in_(page_ids))
    )
    violations = violations_result.scalars().all()

    pages_with_v = len(
        {v.page_id for v in violations if v.page_id}
    )

    # Строим схемы страниц с агрегатами
    v_by_page: dict[str, int] = {}
    for v in violations:
        if v.page_id:
            v_by_page[v.page_id] = v_by_page.get(v.page_id, 0) + 1

    page_schemas = [
        PageSchema(
            id=p.id,
            url=p.url,
            depth=p.depth,
            violations_count=v_by_page.get(p.id, 0),
        )
        for p in pages
    ]

    page_url_map = {p.id: p.url for p in pages}

    violation_schemas = [
        ViolationSchema(
            id=v.id,
            type=v.type,
            page_url=page_url_map.get(v.page_id) if v.page_id else None,
            details=v.details or {},
            word=v.details.get("word") if v.details else None,
            normal_form=v.details.get("normal_form") if v.details else None,
            text_context=v.details.get("text_context", "") if v.details else "",
            visual_weight_foreign=v.details.get("visual_weight_foreign") if v.details else None,
            visual_weight_rus=v.details.get("visual_weight_rus") if v.details else None,
        )
        for v in violations
    ]

    return ScanStatusResponse(
        status=scan.status,
        summary=ScanSummary(
            total_pages=len(pages),
            pages_with_violations=pages_with_v,
            total_violations=len(violations),
        ),
        pages=page_schemas,
        violations=violation_schemas,
    )


@router.get("/scan/{scan_id}/violations", response_model=list[ViolationSchema])
async def get_scan_violations(
    scan_id: str,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
) -> list[ViolationSchema]:
    """Дополнительный эндпоинт для пагинации нарушений (чтобы не вешать браузер)."""
    # Получаем страницы для этого скана, чтобы найти URL
    pages_q_full = await db.execute(select(Page.id, Page.url).where(Page.scan_id == scan_id))
    page_map = {row.id: row.url for row in pages_q_full.all()}
    page_ids = list(page_map.keys())
    
    if not page_ids:
        return []

    violations_result = await db.execute(
        select(Violation)
        .where(Violation.page_id.in_(page_ids))
        .offset(skip)
        .limit(limit)
    )
    violations = violations_result.scalars().all()

    return [
        ViolationSchema(
            id=v.id,
            type=v.type,
            page_url=page_map.get(v.page_id),
            details=v.details or {},
            word=v.details.get("word") if v.details else None,
            normal_form=v.details.get("normal_form") if v.details else None,
            text_context=v.details.get("text_context", "") if v.details else "",
            visual_weight_foreign=v.details.get("visual_weight_foreign") if v.details else None,
            visual_weight_rus=v.details.get("visual_weight_rus") if v.details else None,
        )
        for v in violations
    ]
