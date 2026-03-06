
import httpx
import json

def call_api():
    url = "http://127.0.0.1:8000/api/v1/scan"
    data = {"url": "https://ya.ru", "max_depth": 1, "max_pages": 1}
    try:
        resp = httpx.post(url, json=data, timeout=10.0)
        print(f"Status: {resp.status_code}")
        print(resp.json())
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    call_api()
