@echo off
echo ============================================================
echo [1/4] Running Backend Unit Tests...
echo ============================================================
cd backend
python -m pytest tests/test_scan_service.py tests/test_api_unit.py -v
if %errorlevel% neq 0 (
    echo [ERROR] Backend Unit Tests Failed!
    exit /b %errorlevel%
)

echo.
echo ============================================================
echo [2/4] Running Frontend Linting...
echo ============================================================
cd ..
npm run lint
if %errorlevel% neq 0 (
    echo [ERROR] Frontend Linting Failed!
    exit /b %errorlevel%
)

echo.
echo ============================================================
echo [3/4] Running Frontend Tests (Vitest)...
echo ============================================================
npm test -- --run
if %errorlevel% neq 0 (
    echo [ERROR] Frontend Tests Failed!
    exit /b %errorlevel%
)

echo.
echo ============================================================
echo [4/4] Running Backend Stability Tests...
echo ============================================================
cd backend
python -m pytest tests/test_stability.py -v
if %errorlevel% neq 0 (
    echo [ERROR] Backend Stability Tests Failed!
    exit /b %errorlevel%
)

echo.
echo ============================================================
echo [SUCCESS] All tests passed!
echo ============================================================
cd ..
