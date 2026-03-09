import requests
import time
import json
import sys

API_URL = "http://localhost:8000/api/v1"

def start_scan(url, depth=2):
    print(f"Starting scan for {url} with depth {depth}...")
    try:
        # Correct path is /scan (singular)
        resp = requests.post(f"{API_URL}/scan", json={"url": url, "max_depth": depth})
        resp.raise_for_status()
        scan_id = resp.json()["scan_id"]
        print(f"Scan started. ID: {scan_id}")
        return scan_id
    except Exception as e:
        print(f"Failed to start scan: {e}")
        if hasattr(e, 'response') and e.response is not None:
             print(f"Response: {e.response.text}")
        sys.exit(1)

def wait_for_scan(scan_id):
    print("Waiting for scan to complete...")
    while True:
        try:
            resp = requests.get(f"{API_URL}/scans")
            resp.raise_for_status()
            scans = resp.json()
            scan = next((s for s in scans if s["id"] == scan_id), None)
            
            if not scan:
                print("Scan not found in history!")
                break
                
            status = scan["status"]
            print(f"Current status: {status}")
            
            if status == "completed":
                print("Scan completed successfully.")
                break
            elif status == "failed":
                print("Scan failed.")
                break
                
            time.sleep(5)
        except Exception as e:
            print(f"Error polling status: {e}")
            time.sleep(5)

def get_results(scan_id):
    print(f"Fetching results for scan {scan_id}...")
    try:
        resp = requests.get(f"{API_URL}/scans/{scan_id}")
        resp.raise_for_status()
        data = resp.json()
        
        # Save results to a file for analysis
        filename = f"scan_results_{scan_id[:8]}.json"
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Results saved to {filename}")
        
        violations = data.get("violations", [])
        print(f"Total violations found: {len(violations)}")
        
        # Simple pattern analysis
        types = {}
        for v in violations:
            v_type = v.get("type", "unknown")
            types[v_type] = types.get(v_type, 0) + 1
            
        print("\nViolation types summary:")
        for t, count in types.items():
            print(f"- {t}: {count}")
            
    except Exception as e:
        print(f"Failed to fetch results: {e}")

if __name__ == "__main__":
    target = "https://solopharm.com"
    sid = start_scan(target)
    wait_for_scan(sid)
    get_results(sid)
