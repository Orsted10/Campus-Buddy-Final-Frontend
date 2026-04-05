# Manual CAPTCHA Mode Guide

## Overview

If Tesseract OCR is not installed, the system automatically switches to **Manual CAPTCHA Mode**. This still automates 90% of the login process - you just need to type the CAPTCHA when prompted.

## How It Works

1. You enter your UID and password in the web interface
2. The system opens a Chrome browser window
3. It navigates to student.culko.in and fills in your UID
4. When it reaches the CAPTCHA page, it pauses
5. **You look at the browser and type the CAPTCHA in the terminal**
6. The system continues: enters password + CAPTCHA, clicks login
7. Extracts cookies and stores them securely
8. Fetches your attendance/marks data

## Using Manual CAPTCHA Mode

### From Web Interface

1. Go to Dashboard → Academics
2. Select "Automated Login" tab
3. Enter your UID and password
4. Click "Connect to CULKO"
5. **Watch your terminal** - it will ask for CAPTCHA
6. Look at the browser window that opened
7. Type the CAPTCHA text in the terminal
8. Press Enter
9. Done! The rest is automatic

### From Command Line

```bash
python automated_culko_login.py --uid YOUR_UID --password YOUR_PASSWORD
```

The script will:
- Detect Tesseract is missing
- Open a browser
- Prompt: `Enter CAPTCHA from browser: `
- You type the CAPTCHA and press Enter

## Example Session

```
Starting automated login...

⚠️  Tesseract OCR not found - using manual CAPTCHA mode
A browser will open. Please enter the CAPTCHA when prompted.

Setting up browser...
Navigating to login page...
Entering UID...
Waiting for password page...
Handling CAPTCHA...

============================================================
CAPTCHA MANUAL ENTRY MODE
============================================================
A browser window will open showing the CAPTCHA.
Please look at the browser and enter the CAPTCHA text below.
============================================================

Enter CAPTCHA from browser: ABC123
CAPTCHA entered manually: ABC123
Entering password...
Waiting for login to complete...
✅ Login successful!
Extracted 8 cookies
Closing browser...
```

## Benefits vs Fully Manual Method

| Feature | Manual CAPTCHA Mode | Old Cookie Method |
|---------|-------------------|-------------------|
| Steps required | 1 (type CAPTCHA) | 6+ (login, F12, copy, paste...) |
| Time | ~30 seconds | ~2-3 minutes |
| Error-prone | No | Yes (easy to miss cookies) |
| Browser automation | ✅ Yes | ❌ No |
| Form filling | ✅ Automatic | ❌ Manual |
| Cookie extraction | ✅ Automatic | ❌ Manual |

## Tips

1. **Keep the terminal visible** - You'll need to type the CAPTCHA there
2. **Browser stays open** - Don't close it until CAPTCHA is entered
3. **CAPTCHA is case-sensitive** - Type exactly as shown
4. **Wrong CAPTCHA?** - The system will retry up to 3 times
5. **Timeout** - You have ~20 seconds to enter CAPTCHA before timeout

## Installing Tesseract for Full Automation

If you want fully automated CAPTCHA solving (no manual typing):

### Windows
1. Download: https://github.com/UB-Mannheim/tesseract/wiki
2. Run installer
3. Add to PATH (or use default path)
4. Restart terminal

### Verify Installation
```bash
tesseract --version
```

Once installed, the system will automatically switch back to fully automated mode.

## Troubleshooting

### "Browser doesn't open"
- Make sure Chrome is installed
- Check if headless mode is forced (it shouldn't be in manual mode)

### "Terminal not showing prompt"
- Check the terminal where you started Next.js dev server
- Look for the CAPTCHA prompt message

### "CAPTCHA expired"
- The system will automatically refresh and try again
- You have 3 attempts maximum

### "Login failed after entering CAPTCHA"
- Double-check you typed the CAPTCHA correctly
- Wait 15 minutes if account is temporarily locked
- Try again with correct credentials

## Why Not Just Install Tesseract?

You should! But manual CAPTCHA mode is great because:
- ✅ Works immediately without installation
- ✅ Still saves tons of time vs full manual method
- ✅ Good backup if Tesseract fails on complex CAPTCHAs
- ✅ Useful for debugging/testing

**Recommendation**: Use manual mode now, install Tesseract later for full automation.
