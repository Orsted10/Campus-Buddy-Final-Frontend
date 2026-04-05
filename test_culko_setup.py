"""
Test script to verify CULKO automation setup
Run this to check if all dependencies are installed correctly
"""

import sys

def check_python_version():
    """Check Python version"""
    print("Checking Python version...")
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required")
        return False
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}")
    return True

def check_package(package_name, import_name=None):
    """Check if a package is installed"""
    if import_name is None:
        import_name = package_name
    
    try:
        __import__(import_name)
        print(f"✅ {package_name}")
        return True
    except ImportError:
        print(f"❌ {package_name} - NOT INSTALLED")
        return False

def check_tesseract():
    """Check if Tesseract OCR is installed"""
    print("\nChecking Tesseract OCR...")
    try:
        import subprocess
        result = subprocess.run(['tesseract', '--version'], 
                              capture_output=True, 
                              text=True, 
                              timeout=5)
        if result.returncode == 0:
            version = result.stdout.split('\n')[0]
            print(f"✅ Tesseract found: {version}")
            return True
        else:
            print("❌ Tesseract not found in PATH")
            return False
    except FileNotFoundError:
        print("❌ Tesseract not installed or not in PATH")
        print("   Install from: https://github.com/UB-Mannheim/tesseract/wiki")
        return False
    except Exception as e:
        print(f"❌ Error checking Tesseract: {e}")
        return False

def main():
    print("=" * 60)
    print("CULKO Automation Setup Verification")
    print("=" * 60)
    print()
    
    all_passed = True
    
    # Check Python version
    if not check_python_version():
        all_passed = False
    print()
    
    # Check required packages
    print("Checking Python packages...")
    packages = [
        ('selenium', 'selenium'),
        ('webdriver-manager', 'webdriver_manager'),
        ('Pillow', 'PIL'),
        ('pytesseract', 'pytesseract'),
        ('requests', 'requests'),
        ('beautifulsoup4', 'bs4'),
    ]
    
    for package_name, import_name in packages:
        if not check_package(package_name, import_name):
            all_passed = False
    
    print()
    
    # Check Tesseract
    if not check_tesseract():
        all_passed = False
    
    print()
    print("=" * 60)
    
    if all_passed:
        print("✅ All checks passed! You're ready to use automated login.")
        print()
        print("Next steps:")
        print("1. Start your Next.js dev server: npm run dev")
        print("2. Navigate to Dashboard → Academics")
        print("3. Select 'Automated Login' tab")
        print("4. Enter your UID and password")
        print("5. Click 'Connect to CULKO'")
    else:
        print("❌ Some checks failed. Please install missing dependencies:")
        print()
        print("Install Python packages:")
        print("  pip install -r requirements-culko.txt")
        print()
        print("Install Tesseract OCR:")
        print("  Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki")
        print("  macOS: brew install tesseract")
        print("  Linux: sudo apt-get install tesseract-ocr")
    
    print("=" * 60)

if __name__ == "__main__":
    main()
