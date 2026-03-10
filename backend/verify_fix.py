import asyncio
import sys
import os
import re
import httpx

# Add backend to path
sys.path.append(os.getcwd())

async def test_new_fetch(url):
    print(f"--- Testing New Fetch Logic for: {url} ---")
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Encoding": "gzip, deflate, br"
    }
    async with httpx.AsyncClient(headers=headers, follow_redirects=True, timeout=30.0, verify=False) as client:
        try:
            resp = await client.get(url)
            content = resp.content
            text = ""
            
            encodings = [resp.encoding, "utf-8", "cp1251", "latin-1"]
            for enc in encodings:
                if not enc: continue
                try:
                    candidate = content.decode(enc)
                    if candidate.count('') < 5:
                        print(f"Success with encoding: {enc}")
                        text = candidate
                        break
                except UnicodeDecodeError:
                    continue
            
            if not text:
                print("Fallback to ignore errors")
                text = content.decode("utf-8", errors="ignore")

            import html
            text = html.unescape(text)
            text = re.sub(r'<(script|style)[^>]*>.*?</\1>', ' ', text, flags=re.DOTALL | re.IGNORECASE)
            text = re.sub(r'<[^>]+>', ' ', text)
            text = re.sub(r'\s+', ' ', text).strip()
            
            print(f"Final Text Length: {len(text)}")
            print(f"Sample: {text[:200]}...")
            if any(c in 'абвгд' for c in text.lower()):
                print("VERIFIED: Russian letters found and readable!")
            else:
                print("WARNING: No Russian letters found.")

        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    url = "https://trekrezan.ru/"
    asyncio.run(test_new_fetch(url))
