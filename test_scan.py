import requests
import json

url = "http://localhost:8000/api/v1/scan"
payload = {
    "url": "https://elentra.ru",
    "max_depth": 0,
    "max_pages": 5
}
headers = {"Content-Type": "application/json"}

try:
    response = requests.post(url, data=json.dumps(payload), headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
