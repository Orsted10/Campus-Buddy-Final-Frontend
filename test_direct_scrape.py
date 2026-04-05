"""
Test scraper - directly fetch and parse CULKO pages
"""

import requests
import json
from bs4 import BeautifulSoup

# Your session cookies (replace with actual cookies from your login)
COOKIES = {
    'ASP.NET_SessionId': 'YOUR_SESSION_ID',
    'UIMSLoginCookie4/4/2026': 'YOUR_COOKIE',
    # Add other cookies here
}

BASE_URL = 'https://student.culko.in'

def test_attendance():
    """Test fetching attendance page"""
    url = f'{BASE_URL}/frmStudentCourseWiseAttendanceSummary.aspx?type=etgkYfqBdH1fSfc255iYGw=='
    
    print("Fetching attendance page...")
    response = requests.get(url, cookies=COOKIES)
    
    print(f"Status: {response.status_code}")
    print(f"Content length: {len(response.text)}")
    
    # Save HTML for inspection
    with open('test_attendance_page.html', 'w', encoding='utf-8') as f:
        f.write(response.text)
    
    print("Saved to test_attendance_page.html")
    
    # Parse with BeautifulSoup
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Find all tables
    tables = soup.find_all('table')
    print(f"\nFound {len(tables)} tables")
    
    for i, table in enumerate(tables):
        rows = table.find_all('tr')
        print(f"\nTable {i}: {len(rows)} rows")
        
        if rows:
            # Print first row (header)
            headers = [th.get_text(strip=True) for th in rows[0].find_all(['th', 'td'])]
            print(f"Headers: {headers[:10]}")  # First 10 columns
            
            # Print second row if exists (data)
            if len(rows) > 1:
                cells = [td.get_text(strip=True) for td in rows[1].find_all('td')]
                print(f"First data row: {cells[:10]}")

def test_marks():
    """Test fetching marks page"""
    url = f'{BASE_URL}/frmStudentMarksView.aspx'
    
    print("\n\nFetching marks page...")
    response = requests.get(url, cookies=COOKIES)
    
    print(f"Status: {response.status_code}")
    print(f"Content length: {len(response.text)}")
    
    # Save HTML
    with open('test_marks_page.html', 'w', encoding='utf-8') as f:
        f.write(response.text)
    
    print("Saved to test_marks_page.html")
    
    # Parse
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Look for accordion or tables
    accordions = soup.find_all('div', id='accordion')
    print(f"\nFound {len(accordions)} accordions")
    
    tables = soup.find_all('table')
    print(f"Found {len(tables)} tables")
    
    for i, table in enumerate(tables[:3]):  # First 3 tables
        rows = table.find_all('tr')
        print(f"\nTable {i}: {len(rows)} rows")
        
        if rows:
            headers = [th.get_text(strip=True) for th in rows[0].find_all(['th', 'td'])]
            print(f"Headers: {headers}")
            
            if len(rows) > 1:
                cells = [td.get_text(strip=True) for td in rows[1].find_all('td')]
                print(f"First row: {cells}")

if __name__ == '__main__':
    print("="*70)
    print("CULKO Direct Page Scraper Test")
    print("="*70)
    print("\nNOTE: Replace COOKIES dict with your actual session cookies first!")
    print("="*70)
    
    # Uncomment to test
    # test_attendance()
    # test_marks()
    
    print("\nTo use:")
    print("1. Login via Session Monitor")
    print("2. Copy cookies from terminal output")
    print("3. Paste into COOKIES dict above")
    print("4. Run this script")
