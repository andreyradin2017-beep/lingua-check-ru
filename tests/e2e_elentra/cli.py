import asyncio
import argparse
import sys
import logging
from .crawler import Crawler
from .interactive import InteractiveTester
from .reporter import Reporter
from playwright.async_api import async_playwright

def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler('e2e_test.log', encoding='utf-8')
        ]
    )

async def run_full_test(base_url: str, depth: int):
    setup_logging()
    logger = logging.getLogger(__name__)
    logger.info(f"Starting FULL E2E Test for {base_url} (depth={depth})")

    crawler = Crawler(base_url, max_depth=depth)
    reporter = Reporter()
    tester = InteractiveTester()

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1920, "height": 1080})
        page = await context.new_page()

        # Phase 1: Discover all URLs via BFS
        logger.info("Phase 1: Discovering URLs...")
        # We rewrite the crawl loop here slightly to use the same browser instance/context for speed
        visited = set()
        queue = [{"url": base_url, "depth": 0}]
        discovered_urls = []

        while queue:
            current = queue.pop(0)
            url = current["url"]
            curr_depth = current["depth"]

            if url in visited or curr_depth > depth:
                continue

            visited.add(url)
            discovered_urls.append(url)
            logger.info(f"  Page {len(discovered_urls)}: {url} (depth {curr_depth})")

            try:
                await page.goto(url, wait_until="domcontentloaded", timeout=20000)
                
                # Capture screenshot
                ss_path = await reporter.capture_screenshot(page, url)
                
                # Interact with buttons and capture errors
                errors = await tester.test_page_elements(page, url)
                
                # Record result
                reporter.add_result(url, "PASS" if not errors else "FAIL", errors, ss_path)

                # Find NEXT links
                if curr_depth < depth:
                    links = await crawler.get_links(page)
                    for link in links:
                        if link not in visited:
                            queue.append({"url": link, "depth": curr_depth + 1})

            except Exception as e:
                logger.error(f" Failed to process {url}: {e}")
                reporter.add_result(url, "ERROR", [str(e)], "")

        await browser.close()
    
    report_file = reporter.generate_markdown_report("E2E_TEST_REPORT.md")
    logger.info(f"Test cycle completed. Report generated: {report_file}")
    return report_file

async def main():
    parser = argparse.ArgumentParser(description="E2E Full Cycle Testing for Elentra")
    parser.add_argument("--url", default="https://elentra.ru", help="Base URL to test")
    parser.add_argument("--depth", type=int, default=2, help="Crawling depth")
    args = parser.parse_args()

    await run_full_test(args.url, args.depth)

if __name__ == "__main__":
    asyncio.run(main())
