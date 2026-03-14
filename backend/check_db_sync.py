
import os
from supabase import create_client

def main():
    url = "https://tefpshqwdlpzohcldayr.supabase.co"
    key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZnBzaHF3ZGxwem9oY2xkYXlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjgxODQyOSwiZXhwIjoyMDg4Mzk0NDI5fQ.y014Ojsi8d65faV_sazRa1ICW8f0UQNQugpPdn5bOvc"
    
    supabase = create_client(url, key)
    
    try:
        # Check scans
        scans = supabase.table("scans").select("*").order("started_at", desc=True).limit(5).execute()
        print("--- LAST 5 SCANS ---")
        for s in scans.data:
            scan_id = s['id']
            pages = supabase.table("pages").select("id", count="exact").eq("scan_id", scan_id).execute()
            print(f"ID: {scan_id}, URL: {s['target_url']}, STATUS: {s['status']}, PAGES: {pages.count if hasattr(pages, 'count') else len(pages.data)}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
