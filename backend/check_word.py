import asyncio
import os
import sys
from dotenv import load_dotenv

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

# Load env from backend/.env
load_dotenv("backend/.env")

from app.supabase_client import get_async_supabase

async def check_word(word: str):
    client = await get_async_supabase()
    resp = await client.table("dictionary_words").select("*").eq("normal_form", word.lower()).execute()
    if resp.data:
        print(f"Word '{word}' found in dictionaries: {[d['source_dictionary'] for d in resp.data]}")
    else:
        print(f"Word '{word}' NOT found in any dictionary.")

if __name__ == "__main__":
    import sys
    word = sys.argv[1] if len(sys.argv) > 1 else "лайфстайл"
    asyncio.run(check_word(word))
