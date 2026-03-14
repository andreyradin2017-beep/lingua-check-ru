#!/usr/bin/env python3
"""
Полная диагностика LinguaCheck-RU
Проверяет все функционалы и находит ошибки
"""
import sys
import asyncio
import urllib.request
import urllib.error
import json
import time


API_URL = "http://127.0.0.1:8000"
FRONTEND_URL = "http://127.0.0.1:5173"


def print_header(text):
    print("\n" + "="*60)
    print(f" {text}")
    print("="*60)


def print_status(name, status, details=""):
    icon = "[OK]" if status else "[FAIL]"
    print(f"{icon} {name}")
    if details:
        print(f"    {details}")


def check_url(url, timeout=5):
    """Проверяет доступность URL"""
    try:
        with urllib.request.urlopen(url, timeout=timeout) as resp:
            return resp.status == 200
    except:
        return False


def get_json(url):
    """Получает JSON"""
    try:
        with urllib.request.urlopen(url, timeout=5) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        return {"error": str(e)}


def test_backend_health():
    """Проверка backend"""
    print_header("ПРОВЕРКА BACKEND")
    
    # Health check
    ok = check_url(f"{API_URL}/api/v1/health")
    print_status("Backend доступен", ok)
    
    if not ok:
        return False
    
    # Проверяем API
    health = get_json(f"{API_URL}/api/v1/health")
    print_status("  - Status", health.get("status") == "ok", health.get("status"))
    print_status("  - Database", health.get("database") == "ok", health.get("database"))
    
    return True


def test_frontend_health():
    """Проверка frontend"""
    print_header("ПРОВЕРКА FRONTEND")
    
    ok = check_url(FRONTEND_URL)
    print_status("Frontend доступен", ok)
    
    return ok


def test_scans():
    """Проверка сканирования"""
    print_header("ПРОВЕРКА СКАНИРОВАНИЯ")
    
    # Получаем список сканов
    scans = get_json(f"{API_URL}/api/v1/scans")
    
    if "error" in scans:
        print_status("Список сканов", False, scans["error"])
        return False
    
    print_status(f"Всего сканов: {len(scans)}", True)
    
    # Анализируем статусы
    status_counts = {}
    for scan in scans[:20]:  # Последние 20
        status = scan.get("status", "unknown")
        status_counts[status] = status_counts.get(status, 0) + 1
    
    print("Статусы сканов:")
    for status, count in status_counts.items():
        icon = "[OK]" if status == "completed" else "[WARN]" if status == "failed" else "[INFO]"
        print(f"  {icon} {status}: {count}")
    
    # Проверяем последний скан
    if scans:
        latest = scans[0]
        print(f"\nПоследний скан:")
        print(f"  ID: {latest['id'][:8]}...")
        print(f"  URL: {latest.get('target_url', 'N/A')}")
        print(f"  Status: {latest.get('status', 'N/A')}")
        
        # Если failed - проверяем детали
        if latest.get("status") == "failed":
            print("  [WARN] Последний скан FAILED - проверяем детали...")
            details = get_json(f"{API_URL}/api/v1/scan/{latest['id']}")
            print(f"  Pages: {details.get('summary', {}).get('total_pages', 0)}")
            print(f"  Violations: {details.get('summary', {}).get('total_violations', 0)}")
    
    return True


def test_trademarks():
    """Проверка брендов"""
    print_header("ПРОВЕРКА БРЕНДОВ")
    
    brands = get_json(f"{API_URL}/api/v1/trademarks")
    
    if "error" in brands:
        print_status("Список брендов", False, brands["error"])
        return False
    
    print_status(f"Всего брендов: {len(brands)}", True)
    
    if brands:
        print("Примеры:")
        for brand in brands[:5]:
            print(f"  - {brand['word']} ({brand['normal_form']})")
    
    return True


def test_exceptions():
    """Проверка исключений"""
    print_header("ПРОВЕРКА ИСКЛЮЧЕНИЙ")
    
    exceptions = get_json(f"{API_URL}/api/v1/exceptions")
    
    if "error" in exceptions:
        print_status("Список исключений", False, exceptions["error"])
        return False
    
    print_status(f"Всего исключений: {len(exceptions)}", True)
    
    if exceptions:
        print("Примеры:")
        for exc in exceptions[:5]:
            print(f"  - {exc['word']}")
    
    return True


def test_text_analysis():
    """Проверка анализа текста"""
    print_header("ПРОВЕРКА АНАЛИЗА ТЕКСТА")
    
    test_text = "Это тестовый текст без нарушений"
    
    try:
        req = urllib.request.Request(
            f"{API_URL}/api/v1/check_text",
            data=json.dumps({"text": test_text, "format": "plain"}).encode(),
            headers={"Content-Type": "application/json"}
        )
        resp = urllib.request.urlopen(req, timeout=10)
        result = json.loads(resp.read().decode())
        
        print_status("Анализ текста", True)
        print(f"  Токенов: {result['summary']['total_tokens']}")
        print(f"  Нарушений: {result['summary']['violations_count']}")
        print(f"  Соответствие: {result['summary']['compliance_percent']}%")
        
        return True
    except Exception as e:
        print_status("Анализ текста", False, str(e))
        return False


def test_delete_functionality():
    """Проверка удаления"""
    print_header("ПРОВЕРКА УДАЛЕНИЯ")
    
    # Создаем тестовый скан
    try:
        req = urllib.request.Request(
            f"{API_URL}/api/v1/scan",
            data=json.dumps({"url": "https://test-delete.com"}).encode(),
            headers={"Content-Type": "application/json"}
        )
        resp = urllib.request.urlopen(req, timeout=10)
        result = json.loads(resp.read().decode())
        scan_id = result["scan_id"]
        
        print_status("Создание тестового скана", True, scan_id[:8])
        
        # Сразу удаляем
        req = urllib.request.Request(
            f"{API_URL}/api/v1/scan/{scan_id}",
            method="DELETE"
        )
        resp = urllib.request.urlopen(req, timeout=10)
        result = json.loads(resp.read().decode())
        
        print_status("Удаление скана", True, result.get("status"))
        
        return True
    except Exception as e:
        print_status("Удаление", False, str(e))
        return False


def run_full_diagnostic():
    """Запуск полной диагностики"""
    print("\n" + "="*60)
    print(" LINGUACHECK-RU FULL DIAGNOSTIC")
    print("="*60)
    print(f"Время: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = {}
    
    # Проверки
    results["Backend"] = test_backend_health()
    results["Frontend"] = test_frontend_health()
    
    if results["Backend"]:
        results["Scans"] = test_scans()
        results["Trademarks"] = test_trademarks()
        results["Exceptions"] = test_exceptions()
        results["Text Analysis"] = test_text_analysis()
        results["Delete"] = test_delete_functionality()
    else:
        print("\n[ERROR] Backend недоступен - пропускаем проверки API")
    
    # Итоги
    print_header("ИТОГИ ДИАГНОСТИКИ")
    
    for name, ok in results.items():
        icon = "[OK]" if ok else "[FAIL]"
        print(f"{icon} {name}")
    
    total = sum(1 for v in results.values() if v)
    print(f"\nВсего: {total}/{len(results)} проверок пройдено")
    
    if total == len(results):
        print("\n[SUCCESS] ВСЕ СИСТЕМЫ РАБОТАЮТ НОРМАЛЬНО!")
        return 0
    else:
        print(f"\n[WARN] {len(results) - total} проверок не пройдены")
        return 1


if __name__ == "__main__":
    sys.exit(run_full_diagnostic())
