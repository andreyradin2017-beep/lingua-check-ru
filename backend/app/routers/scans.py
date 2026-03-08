import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.database import get_db
from app.supabase_client import get_async_supabase
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
) -> ScanStartResponse:
    """
    specs/api.md — POST /api/v1/scan
    Запускает сканирование сайта в фоновом режиме.
    """
    client = await get_async_supabase()
    # Создаём проект и скан в БД через REST API
    project_id = str(uuid.uuid4())
    project_data = {"id": project_id, "name": body.url}
    await client.table("projects").insert(project_data).execute()

    scan_id = str(uuid.uuid4())
    scan_data = {
        "id": scan_id,
        "project_id": project_id,
        "target_url": body.url,
        "status": "started",
        "max_depth": body.max_depth,
        "max_pages": body.max_pages,
    }
    await client.table("scans").insert(scan_data).execute()

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
async def get_scans() -> list[ScanHistoryItem]:
    """Возвращает историю сканирований от новых к старым."""
    client = await get_async_supabase()
    resp = await client.table("scans").select("*").order("started_at", desc=True).limit(100).execute()
    return resp.data


@router.get("/scan/{scan_id}", response_model=ScanStatusResponse)
async def get_scan(
    scan_id: str,
) -> ScanStatusResponse:
    """specs/api.md — GET /api/v1/scan/{scan_id}"""
    client = await get_async_supabase()
    # Получаем скан
    scan_resp = await client.table("scans").select("*").eq("id", scan_id).execute()
    if not scan_resp.data:
        raise HTTPException(status_code=404, detail="Скан не найден")
    scan = scan_resp.data[0]

    # Получаем страницы
    pages_resp = await client.table("pages").select("*").eq("scan_id", scan_id).execute()
    pages = pages_resp.data

    # Получаем нарушения (чанками по 100 страниц, чтобы избежать огромных запросов)
    page_ids = [p["id"] for p in pages]
    violations = []
    if page_ids:
        for i in range(0, len(page_ids), 100):
            chunk = page_ids[i:i+100]
            try:
                v_resp = await client.table("violations").select("*").in_("page_id", chunk).execute()
                violations.extend(v_resp.data)
            except Exception as e:
                logger.warning("Failed to fetch violations chunk: %s", e)
    
    pages_with_v = len({v["page_id"] for v in violations if v.get("page_id")})

    # Группируем нарушения по страницам
    v_by_page: dict[str, int] = {}
    for v in violations:
        pid = v.get("page_id")
        if pid:
            v_by_page[pid] = v_by_page.get(pid, 0) + 1

    page_schemas = [
        PageSchema(
            id=p["id"],
            url=p["url"],
            depth=p["depth"],
            violations_count=v_by_page.get(p["id"], 0),
        )
        for p in pages
    ]

    page_url_map = {p["id"]: p["url"] for p in pages}

    violation_schemas = [
        ViolationSchema(
            id=v["id"],
            type=v["type"],
            page_url=page_url_map.get(v.get("page_id")) if v.get("page_id") else None,
            details=v.get("details") or {},
            word=v.get("details", {}).get("word") if v.get("details") else None,
            normal_form=v.get("details", {}).get("normal_form") if v.get("details") else None,
            text_context=v.get("details", {}).get("text_context", "") if v.get("details") else "",
            visual_weight_foreign=v.get("details", {}).get("visual_weight_foreign") if v.get("details") else None,
            visual_weight_rus=v.get("details", {}).get("visual_weight_rus") if v.get("details") else None,
        )
        for v in violations
    ]

    return ScanStatusResponse(
        status=scan["status"],
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
) -> list[ViolationSchema]:
    """Дополнительный эндпоинт для пагинации нарушений (чтобы не вешать браузер)."""
    client = await get_async_supabase()
    # Получаем страницы одним запросом
    pages_resp = await client.table("pages").select("id, url").eq("scan_id", scan_id).execute()
    page_map = {p["id"]: p["url"] for p in pages_resp.data}
    page_ids = list(page_map.keys())
    
    if not page_ids:
        return []

    # Нарушения с пагинацией
    v_resp = await client.table("violations").select("*").in_("page_id", page_ids).range(skip, skip + limit - 1).execute()
    violations = v_resp.data

    return [
        ViolationSchema(
            id=v["id"],
            type=v["type"],
            page_url=page_map.get(v.get("page_id")),
            details=v.get("details") or {},
            word=v.get("details", {}).get("word") if v.get("details") else None,
            normal_form=v.get("details", {}).get("normal_form") if v.get("details") else None,
            text_context=v.get("details", {}).get("text_context", "") if v.get("details") else "",
            visual_weight_foreign=v.get("details", {}).get("visual_weight_foreign") if v.get("details") else None,
            visual_weight_rus=v.get("details", {}).get("visual_weight_rus") if v.get("details") else None,
        )
        for v in violations
    ]


@router.delete("/scan/{scan_id}")
async def delete_scan(scan_id: str):
    """Удаляет скан и все связанные с ним данные (страницы, нарушения)."""
    client = await get_async_supabase()
    
    # 1. Находим скан
    scan_resp = await client.table("scans").select("project_id").eq("id", scan_id).execute()
    if not scan_resp.data:
        raise HTTPException(status_code=404, detail="Скан не найден")
    
    project_id = scan_resp.data[0].get("project_id")
    
    # 2. Получаем ID страниц
    pages_resp = await client.table("pages").select("id").eq("scan_id", scan_id).execute()
    page_ids = [p["id"] for p in pages_resp.data]
    
    # 3. Каскадное удаление через REST
    if page_ids:
        # Удаляем нарушения и токены пачками по 100
        for i in range(0, len(page_ids), 100):
            chunk = page_ids[i:i+100]
            await client.table("violations").delete().in_("page_id", chunk).execute()
            await client.table("tokens").delete().in_("page_id", chunk).execute()
            
    # 4. Удаляем страницы
    await client.table("pages").delete().eq("scan_id", scan_id).execute()
    
    # 5. Удаляем скан
    await client.table("scans").delete().eq("id", scan_id).execute()
    
    # 6. Удаляем проект
    if project_id:
        try:
            await client.table("projects").delete().eq("id", project_id).execute()
        except Exception as e:
            logger.warning("Could not delete project %s: %s", project_id, e)

    logger.info("Scan %s and its data deleted via REST API", scan_id)
    return {"status": "deleted", "scan_id": scan_id}

@router.delete("/scans")
async def clear_scans() -> dict:
    """Очищает всю историю сканирований."""
    client = await get_async_supabase()
    
    # Удаляем всё по очереди
    # На бесплатном тарифе Supabase REST не дает TRUNCATE, удаляем через фильтр
    for table in ["violations", "tokens", "pages", "scans", "projects"]:
        await client.table(table).delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    
    logger.info("All scans history cleared via REST API")
    return {"status": "cleared"}

