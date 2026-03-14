import asyncio
import os
import sys

# Добавляем путь к backend
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.supabase_client import get_async_supabase

async def get_project_id():
    try:
        client = await get_async_supabase()
        response = await client.table('projects').select('id').limit(1).execute()
        if response.data:
            print(response.data[0]['id'])
        else:
            print("None")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(get_project_id())
