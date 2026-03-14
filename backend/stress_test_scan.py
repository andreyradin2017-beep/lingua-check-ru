import asyncio
import uuid
import time
import sys
import os
from datetime import datetime, timezone

# Добавляем путь к backend, чтобы импорты работали
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.services.scan_service import _run_scan
from app.supabase_client import get_async_supabase

async def stress_test():
    scan_id = str(uuid.uuid4())
    url = "https://elentra.ru/"
    max_depth = 2
    max_pages = 20
    project_id = "18c4f145-c53d-4ff8-81bd-a88667b68663" # Получен из get_pid.py
    
    client = await get_async_supabase()
    
    print(f"--- Preparing Stress Test for {url} ---")
    
    try:
        await client.table("scans").insert({
            "id": scan_id,
            "project_id": project_id,
            "target_url": url,
            "status": "pending",
            "started_at": datetime.now(timezone.utc).isoformat()
        }).execute()
        print(f"Created scan record: {scan_id}")
    except Exception as e:
        print(f"Failed to create scan record: {e}")
        return

    print(f"--- Starting Stress Test ---")
    start_time = time.time()
    
    try:
        await _run_scan(scan_id, url, max_depth, max_pages)
    except Exception as e:
        print(f"Test execution failed: {e}")
    
    end_time = time.time()
    duration = end_time - start_time
    
    try:
        # Получаем данные о страницах
        pages_resp = await client.table("pages").select("id").eq("scan_id", scan_id).execute()
        processed_pages = len(pages_resp.data) if pages_resp.data else 0
        
        print(f"--- Stress Test Results ---")
        print(f"Total time: {duration:.2f} seconds")
        print(f"Processed pages: {processed_pages}")
        if processed_pages > 0:
            print(f"Average time per page: {duration/processed_pages:.2f} seconds")
            
            page_ids = [p['id'] for p in pages_resp.data]
            viol_resp = await client.table("violations").select("id", count="exact").in_("page_id", page_ids).execute()
            violations_count = viol_resp.count if viol_resp.count is not None else 0
            print(f"Violations found: {violations_count}")
            
    except Exception as e:
        print(f"Failed to fetch final stats: {e}")

if __name__ == "__main__":
    asyncio.run(stress_test())
