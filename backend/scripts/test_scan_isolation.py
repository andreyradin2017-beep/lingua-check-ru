
import asyncio
import logging
import uuid
from app.database import engine
from app.models import Base, Project, Scan
from app.services.scan_service import _run_scan
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal

logging.basicConfig(level=logging.INFO)

async def test_scan():
    # Ensure tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    scan_id = str(uuid.uuid4())
    url = "https://ya.ru"
    
    async with AsyncSessionLocal() as db:
        project = Project(id=str(uuid.uuid4()), name=url)
        db.add(project)
        await db.flush()
        
        scan = Scan(
            id=scan_id,
            project_id=project.id,
            target_url=url,
            status="started",
            max_depth=1,
            max_pages=1
        )
        db.add(scan)
        await db.commit()
    
    print(f"Starting scan {scan_id}...")
    await _run_scan(scan_id, url, 1, 1)
    print("Scan finished.")

if __name__ == "__main__":
    if __import__("sys").platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    asyncio.run(test_scan())
