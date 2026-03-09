import asyncio
from typing import Set, List, Dict
from urllib.parse import urljoin, urlparse
from playwright.async_api import async_playwright, Page, Browser

class Crawler:
    def __init__(self, base_url: str, max_depth: int = 2):
        self.base_url = base_url
        self.max_depth = max_depth
        self.visited_urls: Set[str] = set()
        self.queue: List[Dict] = [{"url": base_url, "depth": 0}]
        self.results: List[str] = []

    def is_internal(self, url: str) -> bool:
        parsed_base = urlparse(self.base_url)
        parsed_url = urlparse(url)
        return parsed_url.netloc == '' or parsed_url.netloc == parsed_base.netloc

    def normalize_url(self, url: str) -> str:
        joined = urljoin(self.base_url, url)
        # Remove fragments and query params for crawling simplicity
        return joined.split('#')[0].split('?')[0].rstrip('/')

    async def get_links(self, page: Page) -> Set[str]:
        links = await page.eval_on_selector_all("a[href]", "elements => elements.map(e => e.getAttribute('href'))")
        internal_links = set()
        for link in links:
            if link:
                normalized = self.normalize_url(link)
                if self.is_internal(normalized):
                    internal_links.add(normalized)
        return internal_links

    async def crawl(self):
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context()
            page = await context.new_page()

            while self.queue:
                current = self.queue.pop(0)
                url = current["url"]
                depth = current["depth"]

                if url in self.visited_urls or depth > self.max_depth:
                    continue

                print(f" Crawling: {url} (depth: {depth})")
                self.visited_urls.add(url)
                self.results.append(url)

                try:
                    await page.goto(url, wait_until="domcontentloaded", timeout=30000)
                    if depth < self.max_depth:
                        new_links = await self.get_links(page)
                        for link in new_links:
                            if link not in self.visited_urls:
                                self.queue.append({"url": link, "depth": depth + 1})
                except Exception as e:
                    print(f" Error crawling {url}: {e}")

            await browser.close()
        return self.results

if __name__ == "__main__":
    crawler = Crawler("https://elentra.ru", max_depth=2)
    asyncio.run(crawler.crawl())
