import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
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
from app.services.scan_service import start_scan_background, stop_scan

logger = logging.getLogger(__name__)
router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/scan", response_model=ScanStartResponse, status_code=202)
@limiter.limit("5/minute")  # Максимум 5 сканирований в минуту
async def create_scan(
    request: Request,
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
        body.max_pages
    )

    return ScanStartResponse(scan_id=scan_id, status="started")


@router.post("/scan/{scan_id}/stop")
async def stop_scan_endpoint(scan_id: str):
    """
    Останавливает активное сканирование.
    """
    success = stop_scan(scan_id)
    if not success:
        # Проверяем статус в БД
        client = await get_async_supabase()
        resp = await client.table("scans").select("status").eq("id", scan_id).execute()
        if not resp.data:
            raise HTTPException(status_code=404, detail="Скан не найден")
        
        status = resp.data[0]["status"]
        if status in ["completed", "failed", "stopped"]:
            return {"status": "ignored", "message": "Скан уже завершен", "current_status": status}
            
        # Если статус в БД "активен", но процесса нет — это "осиротевший" скан.
        # Просто переводим его в "stopped".
        logger.info("Scan %s: orphaned scan found, marking as stopped in DB", scan_id)
        from datetime import datetime, timezone
        await client.table("scans").update({
            "status": "stopped",
            "finished_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", scan_id).execute()
        
        return {"status": "stopped_orphaned", "scan_id": scan_id}
    
    return {"status": "stopping", "scan_id": scan_id}


@router.get("/scans", response_model=list[ScanHistoryItem])
async def get_scans() -> list[ScanHistoryItem]:
    """Возвращает историю сканирований от новых к старым."""
    client = await get_async_supabase()
    resp = await client.table("scans").select("*").order("started_at", desc=True).limit(100).execute()
    return resp.data


@router.get("/scan/{scan_id}", response_model=ScanStatusResponse)
async def get_scan(
    scan_id: str,
    limit: int = 5000,  # Лимит нарушений (по умолчанию 5000 для больших сканов)
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

    # Получаем нарушения с лимитом (чтобы не перегружать frontend)
    page_ids = [p["id"] for p in pages]
    violations = []
    if page_ids:
        # Берем только первые N нарушений для производительности
        try:
            v_resp = await client.table("violations").select("*").in_("page_id", page_ids).limit(limit).execute()
            violations = v_resp.data
        except Exception as e:
            logger.warning("Failed to fetch violations: %s", e)

    pages_with_v = len({v["page_id"] for v in violations if v.get("page_id")})

    # Группируем нарушения по страницам (для счетчика)
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
        )
        for v in violations
    ]

    return ScanStatusResponse(
        status=scan["status"],
        target_url=scan.get("target_url"),
        summary=ScanSummary(
            total_pages=len(pages),
            pages_with_violations=pages_with_v,
            total_violations=len(violations),  # Показываем сколько фактически вернули
        ),
        pages=page_schemas,
        violations=violation_schemas,
    )


@router.get("/scan/{scan_id}/grouped", response_model=list)
async def get_scan_grouped(
    scan_id: str,
    page_id: str = None,  # Если указан - группируем только для этой страницы
) -> list:
    """Группирует нарушения по слову + тип + страница (word xN)"""
    client = await get_async_supabase()
    
    # Получаем страницы
    if page_id:
        pages_resp = await client.table("pages").select("id, url").eq("id", page_id).execute()
    else:
        pages_resp = await client.table("pages").select("id, url").eq("scan_id", scan_id).execute()
    
    pages = pages_resp.data
    page_ids = [p["id"] for p in pages]
    page_url_map = {p["id"]: p["url"] for p in pages}
    
    if not page_ids:
        return []
    
    # Получаем все нарушения
    violations = []
    for i in range(0, len(page_ids), 100):
        chunk = page_ids[i:i+100]
        try:
            v_resp = await client.table("violations").select("*").in_("page_id", chunk).execute()
            violations.extend(v_resp.data)
        except Exception as e:
            logger.warning("Failed to fetch violations chunk: %s", e)
    
    # Группируем: (page_id, word, normal_form, type) -> count
    from collections import defaultdict
    groups = defaultdict(lambda: {"count": 0, "contexts": [], "id": None})
    
    for v in violations:
        details = v.get("details", {})
        word = details.get("word", "N/A")
        normal_form = details.get("normal_form", "")
        v_type = v.get("type", "unknown")
        page_id_key = v.get("page_id", "unknown")
        context = details.get("text_context", "")
        
        key = (page_id_key, word, normal_form, v_type)
        groups[key]["count"] += 1
        if len(groups[key]["contexts"]) < 3:  # Сохраняем до 3 контекстов
            groups[key]["contexts"].append(context)
        if not groups[key]["id"]:
            groups[key]["id"] = v["id"]  # ID первого нарушения
    
    # Формируем результат
    result = []
    for (page_id_key, word, normal_form, v_type), data in groups.items():
        result.append({
            "id": data["id"],
            "type": v_type,
            "page_url": page_url_map.get(page_id_key, "Unknown"),
            "word": word,
            "normal_form": normal_form,
            "count": data["count"],  # Количество повторений
            "text_context": data["contexts"][0] if data["contexts"] else "",
            "contexts": data["contexts"],  # Все сохраненные контексты
        })
    
    # Сортируем по количеству (сначала самые частые)
    result.sort(key=lambda x: -x["count"])
    
    return result


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
        )
        for v in violations
    ]


@router.delete("/scan/{scan_id}")
async def delete_scan(scan_id: str):
    """Удаляет скан и все связанные с ним данные (страницы, нарушения)."""
    logger.info("Request to delete scan: %s", scan_id)
    client = await get_async_supabase()
    
    try:
        # 1. Находим скан
        scan_resp = await client.table("scans").select("project_id").eq("id", scan_id).execute()
        if not scan_resp.data:
            logger.warning("Scan not found: %s", scan_id)
            raise HTTPException(status_code=404, detail="Скан не найден")
        
        project_id = scan_resp.data[0].get("project_id")
        
        # 2. Удаление связанных данных (каскадное в БД должно работать, но здесь делаем явно)
        # На нарушениях и токенах могут быть индексы, удаляем сначала их
        pages_resp = await client.table("pages").select("id").eq("scan_id", scan_id).execute()
        page_ids = [p["id"] for p in pages_resp.data]
        
        if page_ids:
            logger.info("Deleting violations and tokens for %d pages", len(page_ids))
            await client.table("violations").delete().in_("page_id", page_ids).execute()
            await client.table("tokens").delete().in_("page_id", page_ids).execute()
            await client.table("pages").delete().eq("scan_id", scan_id).execute()
            
        # 3. Удаляем скан
        await client.table("scans").delete().eq("id", scan_id).execute()
        
        # 4. Удаляем проект (если есть)
        if project_id:
            logger.info("Deleting project: %s", project_id)
            await client.table("projects").delete().eq("id", project_id).execute()

        logger.info("Scan %s deleted successfully", scan_id)
        return {"status": "deleted", "scan_id": scan_id}
    except Exception as e:
        logger.error("Error during scan deletion %s: %s", scan_id, str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/scans")
async def clear_scans() -> dict:
    """Очищает всю историю сканирований чанками для предотвращения таймаутов."""
    logger.info("Request to clear ALL scans history (chunked)")
    client = await get_async_supabase()

    try:
        # Для каждой таблицы удаляем записи чанками
        # Supabase REST API не поддерживает TRUNCATE, поэтому удаляем через фильтр по частям
        target_tables = ["violations", "tokens", "pages", "scans", "projects"]

        for table in target_tables:
            logger.info("Clearing table: %s...", table)
            deleted_count = 0
            while True:
                # На бесплатном тарифе удаляем по 1000 записей
                # Используем is.not.eq() для удаления всех записей
                resp = await client.table(table).delete().neq("id", "00000000-0000-0000-0000-000000000000").limit(1000).execute()

                # Если данных больше нет (пустой список) — переходим к следующей таблице
                # resp.data содержит удаленные записи, если их не было - будет []
                if resp.data is None or len(resp.data) == 0:
                    break

                deleted_count += len(resp.data)
                logger.debug("Deleted %d records from %s", deleted_count, table)

                # Короткая пауза для стабильности Event Loop и БД
                await asyncio.sleep(0.1)

            logger.info("Table %s cleared. Total records removed: %d", table, deleted_count)

        logger.info("All scans history cleared successfully")
        return {"status": "cleared", "message": "History cleared via chunked deletion"}
    except Exception as e:
        logger.error("Error during history clearing: %s", str(e))
        raise HTTPException(status_code=500, detail=str(e))

