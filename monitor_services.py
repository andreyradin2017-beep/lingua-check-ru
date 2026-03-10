#!/usr/bin/env python3
"""
Скрипт для проверки и перезапуска сервисов LinguaCheck-RU
"""
import subprocess
import sys
import time
import urllib.request
import urllib.error


FRONTEND_URL = "http://127.0.0.1:5173"
BACKEND_URL = "http://127.0.0.1:8000/api/v1/health"


def check_service(url, name):
    """Проверяет доступность сервиса"""
    try:
        with urllib.request.urlopen(url, timeout=5) as resp:
            if resp.status == 200:
                print(f"[OK] {name} работает")
                return True
            else:
                print(f"[ERR] {name} вернул статус {resp.status}")
                return False
    except urllib.error.URLError:
        print(f"[ERR] {name} не отвечает")
        return False
    except Exception as e:
        print(f"[ERR] {name} ошибка: {e}")
        return False


def kill_node_processes():
    """Убивает все node процессы"""
    try:
        subprocess.run("taskkill /F /IM node.exe 2>nul", shell=True, check=False)
        print("[OK] Node процессы остановлены")
    except Exception as e:
        print(f"[WARN] Ошибка при остановке node: {e}")


def start_frontend():
    """Запускает frontend dev сервер"""
    try:
        print("[INFO] Запуск frontend...")
        subprocess.Popen(
            "npm run dev",
            shell=True,
            cwd="d:\\Template\\russian-lang",
            creationflags=subprocess.CREATE_NEW_PROCESS_GROUP
        )
        time.sleep(5)  # Ждем запуска
        print("[OK] Frontend запущен")
        return True
    except Exception as e:
        print(f"[ERR] Ошибка запуска frontend: {e}")
        return False


def start_backend():
    """Запускает backend сервер"""
    try:
        print("[INFO] Запуск backend...")
        subprocess.Popen(
            "python run.py",
            shell=True,
            cwd="d:\\Template\\russian-lang\\backend",
            creationflags=subprocess.CREATE_NEW_PROCESS_GROUP
        )
        time.sleep(5)  # Ждем запуска
        print("[OK] Backend запущен")
        return True
    except Exception as e:
        print(f"[ERR] Ошибка запуска backend: {e}")
        return False


def run_tests():
    """Запускает тесты"""
    print("\n[INFO] Запуск тестов...")
    
    # Backend тесты
    print("\nBackend тесты:")
    subprocess.run(
        "python -m pytest backend/tests/ -v --tb=short",
        shell=True,
        cwd="d:\\Template\\russian-lang"
    )
    
    # E2E тесты (если сервисы запущены)
    if check_service(FRONTEND_URL, "Frontend") and check_service(BACKEND_URL, "Backend"):
        print("\nE2E тесты:")
        subprocess.run(
            "python -m pytest tests/test_e2e_playwright.py -v --tb=short",
            shell=True,
            cwd="d:\\Template\\russian-lang"
        )


def main():
    print("="*60)
    print("LINGUACHECK-RU SERVICE MONITOR")
    print("="*60)
    
    # Проверка сервисов
    frontend_ok = check_service(FRONTEND_URL, "Frontend")
    backend_ok = check_service(BACKEND_URL, "Backend")
    
    # Если оба работают - всё ок
    if frontend_ok and backend_ok:
        print("\n[OK] Все сервисы работают!")
        return 0
    
    # Если что-то упало - перезапускаем
    print("\n[WARN] Обнаружены проблемы. Перезапуск...")
    
    # Останавливаем node
    kill_node_processes()
    time.sleep(2)
    
    # Также останавливаем python процессы (backend)
    subprocess.run("taskkill /F /FI \"WINDOWTITLE eq python*\" 2>nul", shell=True, check=False)
    time.sleep(2)
    
    # Запускаем сервисы
    start_frontend()
    start_backend()
    
    # Проверяем что запустилось
    time.sleep(5)
    frontend_ok = check_service(FRONTEND_URL, "Frontend")
    backend_ok = check_service(BACKEND_URL, "Backend")
    
    if frontend_ok and backend_ok:
        print("\n[OK] Сервисы успешно перезапущены!")
        return 0
    else:
        print("\n[ERR] Не удалось перезапустить сервисы")
        return 1


if __name__ == "__main__":
    if len(sys.argv) > 1:
        if sys.argv[1] == "test":
            run_tests()
        elif sys.argv[1] == "restart":
            kill_node_processes()
            time.sleep(2)
            start_frontend()
            start_backend()
        elif sys.argv[1] == "check":
            frontend_ok = check_service(FRONTEND_URL, "Frontend")
            backend_ok = check_service(BACKEND_URL, "Backend")
            sys.exit(0 if (frontend_ok and backend_ok) else 1)
    else:
        sys.exit(main())
