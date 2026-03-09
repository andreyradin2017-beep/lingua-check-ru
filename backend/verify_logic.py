import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def verify():
    print("--- 1. Testing Exceptions API ---")
    # Add exception
    resp = requests.post(f"{BASE_URL}/exceptions", json={"word": "gmp"})
    print(f"Add exception 'gmp': {resp.status_code}")
    if resp.status_code != 200:
        print(f"Error: {resp.text}")

    print("\n--- 2. Testing Text Check Logic ---")
    test_text = "Стандарт GMP и достижение XXVI века. Также проверим ISO."
    # Add ISO too
    requests.post(f"{BASE_URL}/exceptions", json={"word": "iso"})
    
    resp = requests.post(f"{BASE_URL}/check_text", json={"text": test_text})
    if resp.status_code == 200:
        data = resp.json()
        violations = data.get("violations", [])
        print(f"Total violations found: {len(violations)}")
        for v in violations:
            print(f"Violation: {v['word']} ({v['type']})")
        
        words_found = [v['word'].lower() for v in violations]
        if "gmp" not in words_found and "xxvi" not in words_found and "iso" not in words_found:
            print("\n✅ SUCCESS: GMP, XXVI and ISO were correctly ignored.")
        else:
            print("\n❌ FAILURE: Some excluded words were found as violations.")
    else:
        print(f"Error checking text: {resp.status_code} - {resp.text}")

if __name__ == "__main__":
    verify()
