@echo off
chcp 65001 >nul
title LinguaCheck-RU - Полный рестарт

echo ============================================================
echo LINGUACHECK-RU - ПОЛНЫЙ ПЕРезапуск
echo ============================================================
echo.

echo [1/5] Остановка всех Node процессов...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul

echo.
echo [2/5] Проверка портов...
netstat -ano | findstr ":5173 :8000" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [WARN] Порты заняты, ожидаем...
    timeout /t 5 >nul
) else (
    echo [OK] Порты свободны
)

echo.
echo [3/5] Очистка кэша Vite...
if exist node_modules\.vite (
    rmdir /s /q node_modules\.vite 2>nul
    echo [OK] Кэш очищен
) else (
    echo [INFO] Кэш не найден
)

echo.
echo [4/5] Запуск Backend...
cd /d backend
start "LinguaCheck Backend" python run.py
timeout /t 5 >nul

echo.
echo [5/5] Запуск Frontend...
cd ..
start "LinguaCheck Frontend" npm run dev
timeout /t 10 >nul

echo.
echo ============================================================
echo ЗАПУСК ЗАВЕРШЕН
echo ============================================================
echo.
echo Frontend: http://127.0.0.1:5173
echo Backend:  http://127.0.0.1:8000
echo Swagger:  http://127.0.0.1:8000/docs
echo.
echo Для остановки: закрой окна или нажми Ctrl+C
echo.
pause
