
print("Importing sys...")
import sys
print("Importing asyncio...")
import asyncio
print("Importing sqlalchemy...")
import sqlalchemy
print("Importing playwright...")
from playwright.async_api import async_playwright
print("Importing pymorphy3...")
import pymorphy3
print("Importing app modules...")
try:
    from app.database import engine
    print("Engine imported")
except Exception as e:
    print(f"Engine import error: {e}")
print("Done.")
