import asyncio
import sys
import os
import re
import httpx
import html

# Add backend to path
sys.path.append(os.getcwd())

async def debug_encoding(url):
    print(f"--- Debugging Encoding for URL: {url} ---")
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    async with httpx.AsyncClient(headers=headers, follow_redirects=True, timeout=20.0, verify=False) as client:
        try:
            resp = await client.get(url)
            print(f"Httpx Status: {resp.status_code}")
            print(f"Httpx Detected Encoding: {resp.encoding}")
            
            content = resp.content
            print(f"Raw binary length: {len(content)}")
            
            # Try UTF-8
            try:
                t_utf8 = content.decode("utf-8")
                print(f"UTF-8 Decode Success. Sample: {t_utf8[:50].replace('\n', ' ')}")
                if '' in t_utf8[:500]:
                    print("UTF-8 contains replacement characters.")
            except Exception as e:
                print(f"UTF-8 Decode Failed: {e}")
            
            # Try CP1251
            try:
                t_1251 = content.decode("cp1251")
                print(f"CP1251 Decode Success. Sample: {t_1251[:100].replace('\n', ' ')}")
            except Exception as e:
                print(f"CP1251 Decode Failed: {e}")

        except Exception as e:
            print(f"Httpx Error: {e}")

if __name__ == "__main__":
    url = "https://trekrezan.ru/"
    asyncio.run(debug_encoding(url))
