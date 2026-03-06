
import asyncio
import sys

async def test_playwright():
    from playwright.async_api import async_playwright
    
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"]
        )
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            ignore_https_errors=True,
            extra_http_headers={
                "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.8",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            }
        )
        page = await context.new_page()
        
        print("Navigating to solopharm.com (wait_until=commit)...")
        try:
            response = await page.goto("https://solopharm.com/", timeout=30000, wait_until="commit")
            print(f"Response: {response.status if response else 'None'}")
            await page.wait_for_load_state("domcontentloaded", timeout=10000)
            text = await page.inner_text("body")
            print(f"Text length: {len(text)} chars")
            print(text[:500])
        except Exception as e:
            print(f"Error: {e}")
            # Даже при ошибке попробуем взять текст
            try:
                text = await page.inner_text("body")
                print(f"Partial text: {text[:200]}")
            except:
                pass
        
        await browser.close()

if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    asyncio.run(test_playwright())
