import httpx
import asyncio

async def main():
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            print("Sending request to http://127.0.0.1:8000/api/v1/scan ...")
            r = await client.post(
                "http://127.0.0.1:8000/api/v1/scan",
                json={"url": "https://melkom.ru", "max_depth": 1, "max_pages": 5, "capture_screenshots": False}
            )
            print("Status:", r.status_code)
            print("Data:", r.json())
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    asyncio.run(main())
