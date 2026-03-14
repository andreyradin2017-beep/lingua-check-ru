import sys
import asyncio

import uvicorn

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    
    # loop="asyncio" заставляет uvicorn использовать стандартную политику, 
    # которую мы переопределили выше на Proactor (нужно для Playwright на Windows)
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True, loop="asyncio")
