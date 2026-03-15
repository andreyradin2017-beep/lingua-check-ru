import asyncio
import logging
from app.celery_app import celery_app
from app.supabase_client import get_async_supabase
from app.services.scan_service import _run_scan
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

@celery_app.task(bind=True, name="app.tasks.run_scan_task")
def run_scan_task(self, scan_id: str, url: str, max_depth: int, max_pages: int, is_resume: bool = False):
    """
    Фоновая задача для запуска сканирования.
    """
    logger.info(f"Starting Celery task for scan {scan_id} (URL: {url}, resume={is_resume})")
    
    async def run_async_scan():
        try:
            await _run_scan(scan_id, url, max_depth, max_pages, is_resume=is_resume)
            logger.info(f"Scan {scan_id} completed successfully via Celery task")
        except Exception as e:
            logger.exception(f"Error in Celery scan task {scan_id}: {e}")
            try:
                client = await get_async_supabase()
                await client.table("scans").update({
                    "status": "failed",
                    "finished_at": datetime.now(timezone.utc).isoformat(),
                    "details": {"error": str(e)}
                }).eq("id", scan_id).execute()
            except Exception as db_err:
                logger.error(f"Failed to update scan status in DB: {db_err}")

    # Запускаем асинхронную логику
    print(f"DEBUG: Starting Celery task execution for {scan_id}")
    try:
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

        if loop.is_running():
            print(f"DEBUG: Loop is running, using run_coroutine_threadsafe for {scan_id}")
            # В Eager моде мы можем захотеть подождать
            future = asyncio.run_coroutine_threadsafe(run_async_scan(), loop)
            if self.app.conf.task_always_eager:
                try:
                    future.result(timeout=60) # Ждем завершения в eager моде
                except Exception as e:
                    print(f"DEBUG: Future result timeout or error: {e}")
        else:
            print(f"DEBUG: Loop is not running, running until complete for {scan_id}")
            loop.run_until_complete(run_async_scan())
    except Exception as e:
        print(f"DEBUG: Fatal error starting task {scan_id}: {e}")
        logger.error(f"Fatal error starting task {scan_id}: {e}")

    return {"scan_id": scan_id, "status": "finished"}
