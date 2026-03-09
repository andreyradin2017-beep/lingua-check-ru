import asyncio
import logging
from typing import List, Dict
from playwright.async_api import Page, ConsoleMessage

logger = logging.getLogger(__name__)

class InteractiveTester:
    def __init__(self):
        self.console_errors: List[str] = []

    def handle_console(self, msg: ConsoleMessage):
        if msg.type == "error":
            error_text = f"Browser Console Error: {msg.text}"
            self.console_errors.append(error_text)
            logger.error(error_text)

    async def get_interactive_elements(self, page: Page):
        """Find all buttons and links that might be interactive"""
        return await page.query_selector_all("button, a.btn, .mantine-Button-root")

    async def test_page_elements(self, page: Page, url: str):
        logger.info(f"Testing interactive elements on {url}")
        self.console_errors = []
        page.on("console", self.handle_console)
        
        elements = await self.get_interactive_elements(page)
        logger.info(f"Found {len(elements)} potential interactive elements")

        for i, el in enumerate(elements):
            try:
                # Get some identifying text for the log
                text = await el.text_content()
                text = (text or "").strip()[:30]
                
                logger.info(f"  [{i+1}/{len(elements)}] Clicking element: '{text}'")
                
                # Attempt to click. Use a short timeout to not hang.
                # We use try/except because some elements might be hidden or disabled.
                await el.click(timeout=3000)
                await asyncio.sleep(0.5) # Wait for potential reaction
                
                # If navigation happened, we might need to go back or ignore
                # For this sweep, we just stay on the page if possible.
                # In a more complex test, we'd handle page transitions.
                
            except Exception as e:
                # Many elements won't be clickable or will throw timeouts, that's expected in a "blind" crawl
                logger.debug(f"  Element interaction failed (expected for some): {text}")
        
        return self.console_errors

if __name__ == "__main__":
    # Quick standalone test logic could go here
    pass
