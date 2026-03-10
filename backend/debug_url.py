import asyncio
import sys
import os
import re

# Add backend to path
sys.path.append(os.getcwd())

from app.services.scan_service import _is_russian_page
from playwright.async_api import async_playwright

async def debug_url(url):
    print(f"--- Debugging URL: {url} ---")
    async with async_playwright() as pw:
        try:
            browser = await pw.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                ignore_https_errors=True
            )
            page = await context.new_page()
            
            print(f"Navigating to {url}...")
            response = await page.goto(url, timeout=60000, wait_until="domcontentloaded")
            print(f"Response status: {response.status if response else 'No Response'}")
            
            # Wait a bit for dynamic content
            await asyncio.sleep(2)
            
            content_text = await page.inner_text("body")
            print(f"Content length: {len(content_text)}")
            
            # Cyrillic check logic
            cyrillic = re.findall(r'[а-яА-ЯёЁ]', content_text)
            letters = re.findall(r'[a-zA-Zа-яА-ЯёЁ]', content_text)
            
            is_ru = _is_russian_page(content_text)
            print(f"Is Russian Page (>10% cyrillic): {is_ru}")
            
            if letters:
                 ratio = len(cyrillic) / len(letters)
                 print(f"Cyrillic ratio: {ratio:.2f} ({len(cyrillic)} / {len(letters)})")
            else:
                 print("No letters found in body text.")

            links = await page.evaluate("() => Array.from(document.querySelectorAll('a[href]')).map(a => a.href)")
            print(f"Found {len(links)} links on page.")
            
            if len(content_text) > 0:
                print(f"Text Snippet: {content_text[:200].replace('\n', ' ')}...")

        except Exception as e:
            print(f"ERROR during debug: {e}")
        finally:
            if 'browser' in locals():
                await browser.close()

async def main():
    urls = ["https://elentra.ru", "https://trekrezan.ru/"]
    for url in urls:
        await debug_url(url)
        print("\n")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    asyncio.run(main())
