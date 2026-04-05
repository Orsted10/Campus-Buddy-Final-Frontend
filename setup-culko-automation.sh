#!/bin/bash

echo "========================================"
echo "CULKO Automation Setup Wizard"
echo "========================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python3 is not installed or not in PATH"
    echo "Please install Python 3.8+ from https://www.python.org/downloads/"
    exit 1
fi

echo "[OK] Python found: $(python3 --version)"
echo ""

# Install Python dependencies
echo "Installing Python dependencies..."
pip3 install -r requirements-culko.txt
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to install Python dependencies"
    exit 1
fi

echo "[OK] Python dependencies installed"
echo ""

# Check Tesseract
if ! command -v tesseract &> /dev/null; then
    echo "[WARNING] Tesseract OCR not found in PATH"
    echo ""
    echo "Tesseract is required for CAPTCHA solving."
    echo "Please install it:"
    echo "  macOS: brew install tesseract"
    echo "  Ubuntu/Debian: sudo apt-get install tesseract-ocr"
    echo "  Fedora: sudo dnf install tesseract"
    echo ""
    read -p "Continue anyway? (y/n): " continue
    if [ "$continue" != "y" ]; then
        exit 1
    fi
else
    echo "[OK] Tesseract found: $(tesseract --version | head -n 1)"
fi

echo ""
echo "========================================"
echo "Running setup verification..."
echo "========================================"
echo ""

python3 test_culko_setup.py

echo ""
echo "========================================"
echo "Setup Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Start your Next.js dev server: npm run dev"
echo "2. Navigate to Dashboard > Academics"
echo "3. Select 'Automated Login' tab"
echo "4. Enter your UID and password"
echo "5. Click 'Connect to CULKO'"
echo ""
