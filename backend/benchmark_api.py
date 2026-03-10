import asyncio
import httpx
import time
import sys

async def benchmark_api(base_url="http://127.0.0.1:8000/api/v1"):
    print(f"--- Benchmarking API Stability for {base_url} ---")
    async with httpx.AsyncClient(timeout=10.0) as client:
        # 1. Health check
        start = time.time()
        try:
            resp = await client.get(f"{base_url}/health")
            print(f"Health check: {resp.status_code} in {time.time()-start:.3f}s")
        except Exception as e:
            print(f"Health check FAILED: {e}")

        # 2. Rate limiting check (5 requests/min limit on /scan)
        print("Testing Rate Limiting (POST /scan)...")
        for i in range(7):
            try:
                # Fake body to trigger limiter
                resp = await client.post(f"{base_url}/scan", json={"url": "https://test.com", "max_depth": 1, "max_pages": 1})
                print(f"Request {i+1}: Status {resp.status_code}")
                if resp.status_code == 429:
                    print("SUCCESS: Rate limit (429) works.")
                    break
            except Exception as e:
                 print(f"Request {i+1} FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(benchmark_api())
