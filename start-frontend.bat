@echo off
chcp 65001 >nul
title LinguaCheck-RU Frontend

echo ============================================================
echo LINGUACHECK-RU FRONTEND - Стабильный запуск
echo ============================================================
echo.

REM Проверка Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js не найден! Установите Node.js 18+
    pause
    exit /b 1
)

REM Проверка порта 5173
netstat -ano | findstr ":5173" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [WARN] Порт 5173 занят. Завершение процесса...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173"') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    timeout /t 2 >nul
)

REM Очистка кэша Vite
if exist node_modules\.vite (
    echo [INFO] Очистка кэша Vite...
    rmdir /s /q node_modules\.vite 2>nul
)

REM Запуск
echo [INFO] Запуск frontend сервера...
echo [INFO] URL: http://127.0.0.1:5173
echo [INFO] Swagger: http://127.0.0.1:8000/docs
echo.
echo ============================================================
echo.

REM Увеличение лимита памяти
set NODE_OPTIONS=--max-old-space-size=4096

npm run dev

pause
