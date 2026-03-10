import asyncio
import os
import sys
from postgrest import SyncPostgrestClient

# Load env
from dotenv import load_dotenv
load_dotenv(".env")

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

def check_schema():
    print(f"Checking schema for {url}")
    # Using sync client for simplicity in diagnostic script
    client = SyncPostgrestClient(f"{url}/rest/v1", headers={"apikey": key, "Authorization": f"Bearer {key}"})
    try:
        # Get one row to check columns
        resp = client.table("pages").select("*").limit(1).execute()
        if resp.data:
            print("Columns found in 'pages':", list(resp.data[0].keys()))
        else:
            print("No data in 'pages', cannot infer columns from data.")
            # Try to get schema via RPC or just assume they are missing
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_schema()
