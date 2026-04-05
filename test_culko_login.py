import requests
from bs4 import BeautifulSoup
import json

BASE_URL = "https://student.culko.in"
LOGIN_URL = BASE_URL + "/Login.aspx"
HOME_URL = BASE_URL + "/StudentHome.aspx"

def test_login():
    session = requests.Session()
    
    # Step 1: Get login page and extract __VIEWSTATE
    print("Step 1: Fetching login page...")
    response = session.get(LOGIN_URL)
    soup = BeautifulSoup(response.text, 'html.parser')
    
    viewstate = soup.find('input', {'name': '__VIEWSTATE'})
    viewgenerator = soup.find('input', {'name': '__VIEWSTATEGENERATOR'})
    eventvalidation = soup.find('input', {'name': '__EVENTVALIDATION'})
    
    print(f"VIEWSTATE found: {viewstate is not None}")
    print(f"VIEWSTATEGENERATOR found: {viewgenerator is not None}")
    print(f"EVENTVALIDATION found: {eventvalidation is not None}")
    
    # Step 2: Attempt login
    print("\nStep 2: Attempting login...")
    login_data = {
        '__VIEWSTATE': viewstate['value'] if viewstate else '',
        '__VIEWSTATEGENERATOR': viewgenerator['value'] if viewgenerator else '',
        '__EVENTVALIDATION': eventvalidation['value'] if eventvalidation else '',
        'txtUserId': '25LBCS3067',
        'txtPassword': 'Rayan2006!',
        'btnLogin': 'Login'
    }
    
    response = session.post(LOGIN_URL, data=login_data, allow_redirects=True)
    print(f"Login response status: {response.status_code}")
    print(f"Final URL: {response.url}")
    
    # Check if login succeeded
    if "StudentHome" in response.url or "Dashboard" in response.text:
        print("✅ Login successful!")
        
        # Save cookies for further testing
        with open('culko_cookies.json', 'w') as f:
            json.dump(requests.utils.dict_from_cookiejar(session.cookies), f)
        
        # Try to access home page
        print("\nStep 3: Fetching student home page...")
        home_response = session.get(HOME_URL)
        print(f"Home page status: {home_response.status_code}")
        
        # Look for common elements
        home_soup = BeautifulSoup(home_response.text, 'html.parser')
        
        # Find links/sections
        links = home_soup.find_all('a', href=True)
        print(f"\nFound {len(links)} links on home page")
        
        # Print interesting links
        for link in links[:20]:  # First 20 links
            href = link['href']
            text = link.get_text(strip=True)
            if text and any(keyword in href.lower() for keyword in ['attendance', 'marks', 'result', 'timetable', 'academic']):
                print(f"  - {text}: {href}")
        
        return True
    else:
        print("❌ Login failed")
        print(f"Response preview: {response.text[:500]}")
        return False

if __name__ == "__main__":
    test_login()
