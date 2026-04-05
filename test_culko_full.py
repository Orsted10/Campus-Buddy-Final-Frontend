import requests
from bs4 import BeautifulSoup
import json

BASE_URL = "https://student.culko.in"
LOGIN_URL = BASE_URL + "/Login.aspx"

def test_two_step_login():
    session = requests.Session()
    
    # Step 1: Get initial page
    print("Step 1: Fetching login page...")
    response = session.get(LOGIN_URL)
    soup = BeautifulSoup(response.text, 'html.parser')
    
    viewstate = soup.find('input', {'name': '__VIEWSTATE'})['value']
    viewgenerator = soup.find('input', {'name': '__VIEWSTATEGENERATOR'})['value']
    hfbackground = soup.find('input', {'name': 'hfcurrentbackground'})['value']
    
    # Step 2: Submit UID (first step)
    print("\nStep 2: Submitting UID...")
    step1_data = {
        '__VIEWSTATE': viewstate,
        '__VIEWSTATEGENERATOR': viewgenerator,
        'hfcurrentbackground': hfbackground,
        'txtUserId': '25LBCS3067',
        'btnNext': 'NEXT'
    }
    
    response = session.post(LOGIN_URL, data=step1_data, allow_redirects=False)
    print(f"Step 1 response status: {response.status_code}")
    
    if response.status_code == 302 or response.status_code == 301:
        next_url = response.headers.get('Location', '')
        print(f"Redirect to: {next_url}")
        response = session.get(BASE_URL + next_url if next_url.startswith('/') else next_url)
    
    # Parse password page
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Check for error
    error_div = soup.find('div', class_='alert-danger') or soup.find('span', style=lambda x: x and 'color:red' in x)
    if error_div:
        print(f"❌ Error: {error_div.get_text(strip=True)}")
        return False
    
    # Extract new VIEWSTATE for password page
    viewstate = soup.find('input', {'name': '__VIEWSTATE'})
    viewgenerator = soup.find('input', {'name': '__VIEWSTATEGENERATOR'})
    
    if not viewstate:
        print("❌ No VIEWSTATE found on password page")
        print(f"Page preview: {response.text[:500]}")
        return False
    
    print("✅ Password page loaded")
    
    # Step 3: Submit password
    print("\nStep 3: Submitting password...")
    step2_data = {
        '__VIEWSTATE': viewstate['value'],
        '__VIEWSTATEGENERATOR': viewgenerator['value'] if viewgenerator else '',
        'hfcurrentbackground': hfbackground,
        'txtPassword': 'Rayan2006!',
        'btnLogin': 'LOGIN'
    }
    
    # Find the actual form action URL
    form = soup.find('form')
    action_url = form.get('action', LOGIN_URL) if form else LOGIN_URL
    if not action_url.startswith('http'):
        action_url = BASE_URL + action_url if action_url.startswith('/') else BASE_URL + '/' + action_url
    
    print(f"Posting to: {action_url}")
    
    response = session.post(action_url, data=step2_data, allow_redirects=True)
    print(f"Login response status: {response.status_code}")
    print(f"Final URL: {response.url}")
    
    # Check if login succeeded
    if "StudentHome" in response.url or "Dashboard" in response.text or response.status_code == 200:
        print("✅ Login successful!")
        
        # Save cookies
        with open('culko_cookies.json', 'w') as f:
            json.dump(requests.utils.dict_from_cookiejar(session.cookies), f)
        
        # Explore home page
        print("\n=== EXPLORING HOME PAGE ===\n")
        home_soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find all links
        links = home_soup.find_all('a', href=True)
        print(f"Found {len(links)} links\n")
        
        interesting_keywords = ['attendance', 'marks', 'result', 'timetable', 'academic', 'grade', 'cgpa', 'profile']
        
        for link in links:
            href = link['href']
            text = link.get_text(strip=True)
            
            if text and any(keyword in href.lower() or keyword in text.lower() for keyword in interesting_keywords):
                print(f"📌 {text}")
                print(f"   URL: {href}")
                print()
        
        # Also check for iframe or other content containers
        iframes = home_soup.find_all('iframe')
        if iframes:
            print(f"\n=== IFRAMES FOUND ({len(iframes)}) ===")
            for iframe in iframes:
                src = iframe.get('src', '')
                print(f"  - {src}")
        
        return True
    else:
        print("❌ Login failed")
        print(f"Response preview: {response.text[:1000]}")
        return False

if __name__ == "__main__":
    test_two_step_login()
