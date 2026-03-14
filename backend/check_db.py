
import asyncio
import os
from supabase import create_client

async def main():
    url = "https://tefpshqwdlpzohcldayr.supabase.co"
    key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZnBzaHF3ZGxwem9oY2xkYXlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjgxODQyOSwiZXhwIjoyMDg4Mzk0NDI5fQ.y014Ojsi8d65faV_sazRa1ICW8f0UQNQugpPdn5bOvc"
    
    supabase = create_client(url, key)
    
    # Check scans and pages
    scans = supabase.table("scans").select("*").order("started_at", desc=True).limit(5).execute()
    print("--- LAST 5 SCANS ---")
    for s in scans.data:
        scan_id = s['id']
        pages = supabase.table("pages").select("count", count="exact").eq("scan_id", scan_id).execute()
        print(f"ID: {scan_id}, URL: {s['target_url']}, STATUS: {s['status']}, PAGES: {pages.count}")

if __name__ == "__main__":
    asyncio.run(main())
