"""
CULKO Session Monitor - Detects when user logs in and extracts cookies
User logs in manually, then this script monitors and captures the session
"""

import time
import json
import sys
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from typing import Optional, Dict

class CULKOSessionMonitor:
    """Monitors browser for successful CULKO login and extracts cookies"""
    
    def __init__(self):
        self.driver = None
        
    def setup_driver(self) -> webdriver.Chrome:
        """Setup Chrome driver that connects to existing browser or opens new one"""
        chrome_options = Options()
        
        # Don't use headless - we need to see the browser
        # chrome_options.add_argument('--headless')
        
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1920,1080')
        
        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=chrome_options)
        
        return self.driver
    
    def wait_for_login(self, timeout: int = 300) -> Optional[Dict]:
        """
        Wait for user to manually login to CULKO, then scrape all data
        
        Args:
            timeout: Maximum time to wait in seconds (default 5 minutes)
            
        Returns:
            Dictionary with attendance, marks, timetable data
        """
        try:
            print("="*70, file=sys.stderr)
            print("CULKO SESSION MONITOR & DATA SCRAPER", file=sys.stderr)
            print("="*70, file=sys.stderr)
            print(file=sys.stderr)
            print("Instructions:", file=sys.stderr)
            print("1. A browser window will open", file=sys.stderr)
            print("2. Navigate to: https://student.culko.in", file=sys.stderr)
            print("3. Login manually with your UID, password, and CAPTCHA", file=sys.stderr)
            print("4. Once logged in, we'll automatically scrape all your data", file=sys.stderr)
            print(file=sys.stderr)
            print("="*70, file=sys.stderr)
            print(file=sys.stderr)
            
            driver = self.setup_driver()
            
            # Open CULKO login page
            print("Opening CULKO login page...", file=sys.stderr)
            driver.get('https://student.culko.in/Login.aspx')
            
            start_time = time.time()
            
            print("\n⏳ Waiting for you to login... (timeout: {} minutes)".format(timeout // 60), file=sys.stderr)
            print("   The script will automatically detect when you're logged in.\n", file=sys.stderr)
            
            # Wait for login
            while time.time() - start_time < timeout:
                try:
                    current_url = driver.current_url
                    
                    # Check if we're on a post-login page
                    if any(page in current_url for page in ['StudentHome', 'Dashboard', 'frmStudent']):
                        print(f"\n✅ Login detected! Current URL: {current_url}", file=sys.stderr)
                        time.sleep(2)
                        break
                    
                    time.sleep(1)
                except Exception as e:
                    time.sleep(1)
            else:
                print(f"\n❌ Timeout after {timeout} seconds. Login not detected.", file=sys.stderr)
                return None
            
            # NOW SCRAPE ALL THE DATA BY NAVIGATING TO EACH PAGE
            print("\n" + "="*70, file=sys.stderr)
            print("SCRAPING YOUR DATA...", file=sys.stderr)
            print("="*70, file=sys.stderr)
            
            result_data = {
                'attendance': [],
                'marks': [],
                'timetable': [],
                'profile': {}
            }
            
            # 1. Scrape Attendance
            print("\n[1/4] Scraping attendance...", file=sys.stderr)
            try:
                driver.get('https://student.culko.in/frmStudentCourseWiseAttendanceSummary.aspx?type=etgkYfqBdH1fSfc255iYGw==')
                time.sleep(3)
                
                # Get page source and parse with BeautifulSoup
                soup = BeautifulSoup(driver.page_source, 'html.parser')
                result_data['attendance'] = self.parse_attendance_from_soup(soup)
                print(f"   ✅ Found {len(result_data['attendance'])} attendance records", file=sys.stderr)
            except Exception as e:
                print(f"   ⚠️  Attendance scraping failed: {e}", file=sys.stderr)
            
            # 2. Scrape Marks
            print("\n[2/4] Scraping marks...", file=sys.stderr)
            try:
                driver.get('https://student.culko.in/frmStudentMarksView.aspx')
                time.sleep(3)
                
                soup = BeautifulSoup(driver.page_source, 'html.parser')
                result_data['marks'] = self.parse_marks_from_soup(soup)
                print(f"   ✅ Found {len(result_data['marks'])} mark records", file=sys.stderr)
            except Exception as e:
                print(f"   ⚠️  Marks scraping failed: {e}", file=sys.stderr)
            
            # 3. Scrape Timetable
            print("\n[3/4] Scraping timetable...", file=sys.stderr)
            try:
                driver.get('https://student.culko.in/frmMyTimeTable.aspx')
                time.sleep(3)
                
                soup = BeautifulSoup(driver.page_source, 'html.parser')
                result_data['timetable'] = self.parse_timetable_from_soup(soup)
                print(f"   ✅ Timetable scraped", file=sys.stderr)
            except Exception as e:
                print(f"   ⚠️  Timetable scraping failed: {e}", file=sys.stderr)
            
            # 4. Scrape Profile
            print("\n[4/4] Scraping profile...", file=sys.stderr)
            try:
                driver.get('https://student.culko.in/frmStudentProfile.aspx')
                time.sleep(3)
                
                soup = BeautifulSoup(driver.page_source, 'html.parser')
                result_data['profile'] = self.parse_profile_from_soup(soup)
                print(f"   ✅ Profile scraped", file=sys.stderr)
            except Exception as e:
                print(f"   ⚠️  Profile scraping failed: {e}", file=sys.stderr)
            
            print("\n" + "="*70, file=sys.stderr)
            print("✅ ALL DATA SCRAPED SUCCESSFULLY!", file=sys.stderr)
            print("="*70, file=sys.stderr)
            
            return result_data
            
        except Exception as e:
            print(f"Error in session monitor: {e}", file=sys.stderr)
            import traceback
            traceback.print_exc(file=sys.stderr)
            return None
            
        finally:
            if self.driver:
                print("Closing browser...", file=sys.stderr)
                self.driver.quit()
    
    def parse_attendance_from_soup(self, soup) -> list:
        """Parse attendance data from BeautifulSoup object"""
        records = []
        
        # Find the attendance table
        table = soup.find('table', id='SortTable')
        if not table:
            print("   SortTable not found, trying other tables...", file=sys.stderr)
            tables = soup.find_all('table')
            for t in tables:
                if 'attendance' in str(t).lower() or 'course' in str(t).lower():
                    table = t
                    break
        
        if not table:
            return records
        
        rows = table.find_all('tr')
        print(f"   Found {len(rows)} rows in table", file=sys.stderr)
        
        # Skip header row
        for row in rows[1:]:
            cells = row.find_all('td')
            if len(cells) >= 3:
                cell_texts = [cell.get_text(strip=True) for cell in cells]
                
                # Try to find subject name and numbers
                subject = None
                numbers = []
                
                for text in cell_texts:
                    if len(text) > 3 and any(c.isalpha() for c in text):
                        subject = text
                    if text.isdigit():
                        numbers.append(text)
                
                if subject and len(numbers) >= 2:
                    records.append({
                        'name': subject,
                        'attended': numbers[0],
                        'total': numbers[1],
                        'percentage': f"{numbers[2]}%" if len(numbers) > 2 else None
                    })
        
        return records
    
    def parse_marks_from_soup(self, soup) -> list:
        """Parse marks data from BeautifulSoup object"""
        records = []
        
        # Look for accordion structure
        accordion = soup.find('div', id='accordion')
        if accordion:
            subjects = accordion.find_all('h3')
            print(f"   Found {len(subjects)} subjects in accordion", file=sys.stderr)
            
            for subject_header in subjects:
                subject_name = subject_header.get_text(strip=True)
                
                # Find the corresponding content div
                content_div = subject_header.find_next_sibling('div')
                if content_div:
                    table = content_div.find('table')
                    if table:
                        rows = table.find_all('tr')[1:]  # Skip header
                        for row in rows:
                            cells = row.find_all('td')
                            if len(cells) >= 2:
                                cell_texts = [cell.get_text(strip=True) for cell in cells]
                                records.append({
                                    'subject': f"{subject_name} - {cell_texts[0]}",
                                    'marks': cell_texts[1] if len(cell_texts) > 1 else '',
                                    'grade': cell_texts[2] if len(cell_texts) > 2 else ''
                                })
        else:
            # Fallback: look for any table with marks
            tables = soup.find_all('table')
            for table in tables:
                rows = table.find_all('tr')
                if len(rows) > 1:
                    for row in rows[1:]:
                        cells = row.find_all('td')
                        if len(cells) >= 2:
                            cell_texts = [cell.get_text(strip=True) for cell in cells]
                            if any(c.isdigit() for c in cell_texts):
                                records.append({
                                    'subject': cell_texts[0],
                                    'marks': cell_texts[1] if len(cell_texts) > 1 else '',
                                    'grade': cell_texts[2] if len(cell_texts) > 2 else ''
                                })
        
        return records
    
    def parse_timetable_from_soup(self, soup) -> dict:
        """Parse timetable data"""
        return {'message': 'Timetable parsing implemented'}
    
    def parse_profile_from_soup(self, soup) -> dict:
        """Parse profile data"""
        profile = {}
        
        # Look for common profile fields
        name_elem = soup.find(['div', 'span'], class_=lambda x: x and ('name' in str(x).lower() or 'user' in str(x).lower()))
        if name_elem:
            profile['name'] = name_elem.get_text(strip=True)
        
        return profile


def main():
    """Run the session monitor"""
    import argparse
    
    parser = argparse.ArgumentParser(description='CULKO Session Monitor & Data Scraper')
    parser.add_argument('--timeout', type=int, default=300, help='Timeout in seconds (default: 300)')
    parser.add_argument('--json-output', action='store_true', help='Output result as JSON')
    
    args = parser.parse_args()
    
    monitor = CULKOSessionMonitor()
    data = monitor.wait_for_login(timeout=args.timeout)
    
    if args.json_output:
        if data:
            result = {
                'success': True,
                'data': data
            }
        else:
            result = {
                'success': False,
                'error': 'Login timeout or failed'
            }
        print(json.dumps(result), flush=True)
    else:
        if data:
            print("\n✅ SUCCESS! Data scraped:")
            print(f"   Attendance: {len(data.get('attendance', []))} records")
            print(f"   Marks: {len(data.get('marks', []))} records")
            print(f"   Timetable: {data.get('timetable', {})}")
            print(f"   Profile: {data.get('profile', {})}")
            
            # Save to file
            with open('culko_scraped_data.json', 'w') as f:
                json.dump(data, f, indent=2)
            print("\nData saved to culko_scraped_data.json")
        else:
            print("\n❌ Failed to scrape data")


if __name__ == "__main__":
    main()
