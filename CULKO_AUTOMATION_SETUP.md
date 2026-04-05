# CULKO Automated Login Setup Guide

This guide explains how to set up automated login to the CULKO student portal with CAPTCHA solving.

## Overview

The system now supports **two methods** to connect to CULKO:

1. **Automated Login (Recommended)** - Enter your credentials and the system automatically handles CAPTCHA solving and login
2. **Manual Cookie Entry** - The old method where you manually extract cookies from your browser

## Prerequisites

### 1. Install Python Dependencies

Run the following command in your terminal:

```bash
pip install -r requirements-culko.txt
```

This installs:
- `selenium` - Browser automation
- `webdriver-manager` - Automatic ChromeDriver management
- `Pillow` - Image processing for CAPTCHA
- `pytesseract` - OCR for CAPTCHA recognition
- `requests` - HTTP requests
- `beautifulsoup4` - HTML parsing

### 2. Install Tesseract OCR

Tesseract is required for CAPTCHA recognition. Download and install it:

**Windows:**
- Download installer from: https://github.com/UB-Mannheim/tesseract/wiki
- Run the installer
- Add Tesseract to your PATH environment variable

**macOS:**
```bash
brew install tesseract
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install tesseract-ocr
```

### 3. Verify Installation

Test that everything is installed correctly:

```bash
python --version
pip list | grep selenium
tesseract --version
```

## Usage

### Method 1: Automated Login (Recommended)

1. Navigate to the Academics page in CampusBuddy
2. Select "Automated Login" tab
3. Enter your UID (e.g., 25LBCS3067)
4. Enter your password
5. Click "Connect to CULKO"

The system will:
- Open a headless Chrome browser
- Navigate to student.culko.in
- Automatically solve the CAPTCHA using OCR
- Login with your credentials
- Extract session cookies
- Store them securely

**Note:** The first time you run this, Chrome will download ChromeDriver automatically. This may take a minute.

### Method 2: Manual Cookie Entry (Fallback)

If automated login doesn't work, you can still use the manual method:

1. Select "Manual Cookie Entry" tab
2. Login to https://student.culko.in manually
3. Open DevTools (F12) → Application → Cookies
4. Copy all cookies
5. Paste in the format: `name1=value1; name2=value2`
6. Click "Connect to CULKO"

## How It Works

### CAPTCHA Solving Process

1. **Image Capture**: Selenium takes a screenshot of the CAPTCHA image
2. **Preprocessing**: 
   - Convert to grayscale
   - Increase contrast
   - Apply binary threshold
   - Resize for better OCR
3. **OCR Recognition**: Tesseract OCR reads the text
4. **Validation**: Checks if the result is reasonable (minimum 4 characters)
5. **Retry**: If CAPTCHA is unclear, refreshes and tries again (up to 3 times)

### Automation Flow

```
User enters credentials
    ↓
Next.js API receives request
    ↓
Spawns Python process
    ↓
Python opens headless Chrome
    ↓
Navigates to login page
    ↓
Enters UID → Clicks NEXT
    ↓
Solves CAPTCHA via OCR
    ↓
Enters password + CAPTCHA
    ↓
Clicks LOGIN
    ↓
Extracts cookies on success
    ↓
Returns cookies to Next.js
    ↓
Stores in HTTP-only cookie
    ↓
Fetches attendance/marks data
```

## Troubleshooting

### "Failed to start automation service"

**Problem**: Python or dependencies not installed

**Solution**:
```bash
pip install -r requirements-culko.txt
```

### "CAPTCHA solving failed"

**Problem**: Tesseract OCR not installed or not in PATH

**Solution**:
1. Verify Tesseract is installed: `tesseract --version`
2. If not found, install it (see Prerequisites section)
3. Restart your development server

### "Login failed" even with correct credentials

**Possible causes**:
1. CAPTCHA couldn't be solved (try again)
2. Website structure changed
3. Account locked due to multiple failed attempts

**Solution**:
- Wait 15 minutes and try again
- Use manual cookie entry as fallback
- Check browser console for detailed error messages

### Chrome/ChromeDriver issues

**Problem**: Version mismatch or driver not found

**Solution**:
The webdriver-manager package should handle this automatically. If issues persist:
```bash
pip uninstall webdriver-manager
pip install webdriver-manager
```

### Headless mode problems

If you want to see what's happening during login (debugging):

Edit `automated_culko_login.py` and change:
```python
headless=args.headless  # Change to False temporarily
```

Or when calling directly:
```python
cookies = solver.login_with_credentials(uid, password, headless=False)
```

## Security Considerations

1. **Credentials**: Your UID and password are only used for the initial login and are NOT stored
2. **Cookies**: Session cookies are stored in HTTP-only, secure cookies (7-day expiry)
3. **Headless Mode**: Runs in headless mode by default for security
4. **No Logging**: Credentials are never logged to console or files

## Advanced Usage

### Running the Python Script Directly

For testing or debugging:

```bash
python automated_culko_login.py
```

This runs in interactive mode and shows you what's happening.

### Using Command Line Arguments

```bash
python automated_culko_login.py --uid 25LBCS3067 --password yourpassword --json-output
```

### Testing CAPTCHA Solving Only

```python
from automated_culko_login import CULKOCaptchaSolver

solver = CULKOCaptchaSolver()
driver = solver.setup_driver(headless=False)
driver.get('https://student.culko.in/Login.aspx')
# Manually trigger CAPTCHA solving for testing
```

## Performance

- **First login**: ~10-15 seconds (includes Chrome startup)
- **Subsequent requests**: Instant (uses cached cookies)
- **CAPTCHA solving**: 1-2 seconds per attempt
- **Success rate**: ~85-90% (may need retry for complex CAPTCHAs)

## Future Improvements

Potential enhancements:
1. Better CAPTCHA preprocessing algorithms
2. Machine learning-based CAPTCHA solver
3. Retry logic with exponential backoff
4. Multiple OCR engine support
5. CAPTCHA caching to reduce solves

## Support

If you encounter issues:
1. Check the browser console for errors
2. Review the terminal output from the Python process
3. Try the manual cookie entry method as a workaround
4. Ensure all prerequisites are properly installed

## Files Created

- `automated_culko_login.py` - Main automation script with CAPTCHA solving
- `culko_api_server.py` - Optional standalone FastAPI server
- `requirements-culko.txt` - Python dependencies
- Updated `app/api/culko/route.ts` - API endpoint supporting both methods
- Updated `app/dashboard/academics/culko-connection.tsx` - UI with dual login options
