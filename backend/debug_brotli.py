import asyncio
import httpx
import brotli

async def debug_brotli(url):
    print(f"--- Debugging Brotli for URL: {url} ---")
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Encoding": "gzip, deflate, br"
    }
    async with httpx.AsyncClient(headers=headers, follow_redirects=True, timeout=20.0, verify=False) as client:
        try:
            resp = await client.get(url)
            print(f"Status: {resp.status_code}")
            print(f"Content-Encoding: {resp.headers.get('Content-Encoding')}")
            
            content = resp.content
            print(f"Raw content size: {len(content)}")
            
            # Если httpx сам не справился, попробуем вручную
            if resp.headers.get('Content-Encoding') == 'br':
                try:
                    decompressed = brotli.decompress(content)
                    print(f"Manual Brotli Decompression Success. Size: {len(decompressed)}")
                    text = decompressed.decode('utf-8', errors='replace')
                    print(f"Text snippet: {text[:200].replace('\n', ' ')}...")
                    if 'А' in text or 'а' in text:
                        print("SUCCESS: Found Russian letters!")
                except Exception as e:
                    print(f"Manual Brotli failed: {e}")
            else:
                text = resp.text
                print(f"Sample text: {text[:100].replace('\n', ' ')}")

        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    url = "https://trekrezan.ru/"
    asyncio.run(debug_brotli(url))
