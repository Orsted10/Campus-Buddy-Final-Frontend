@echo off
echo ========================================
echo CULKO Automation Setup Wizard
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org/downloads/
    pause
    exit /b 1
)

echo [OK] Python found
echo.

REM Install Python dependencies
echo Installing Python dependencies...
pip install -r requirements-culko.txt
if errorlevel 1 (
    echo [ERROR] Failed to install Python dependencies
    pause
    exit /b 1
)

echo [OK] Python dependencies installed
echo.

REM Check Tesseract
where tesseract >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Tesseract OCR not found in PATH
    echo.
    echo Tesseract is required for CAPTCHA solving.
    echo Please download and install from:
    echo https://github.com/UB-Mannheim/tesseract/wiki
    echo.
    echo After installation, restart this script.
    echo.
    set /p continue="Continue anyway? (y/n): "
    if /i not "%continue%"=="y" exit /b 1
) else (
    echo [OK] Tesseract found
)

echo.
echo ========================================
echo Running setup verification...
echo ========================================
echo.

python test_culko_setup.py

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Start your Next.js dev server: npm run dev
echo 2. Navigate to Dashboard ^> Academics
echo 3. Select "Automated Login" tab
echo 4. Enter your UID and password
echo 5. Click "Connect to CULKO"
echo.
pause
