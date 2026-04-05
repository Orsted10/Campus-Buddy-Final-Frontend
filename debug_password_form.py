import requests
from bs4 import BeautifulSoup

BASE_URL = "https://student.culko.in"
LOGIN_URL = BASE_URL + "/Login.aspx"

session = requests.Session()

# Step 1: Get login page
response = session.get(LOGIN_URL)
soup = BeautifulSoup(response.text, 'html.parser')

viewstate = soup.find('input', {'name': '__VIEWSTATE'})['value']
viewgenerator = soup.find('input', {'name': '__VIEWSTATEGENERATOR'})['value']
hfbackground = soup.find('input', {'name': 'hfcurrentbackground'})['value']

# Step 2: Submit UID
step1_data = {
    '__VIEWSTATE': viewstate,
    '__VIEWSTATEGENERATOR': viewgenerator,
    'hfcurrentbackground': hfbackground,
    'txtUserId': '25LBCS3067',
    'btnNext': 'NEXT'
}

response = session.post(LOGIN_URL, data=step1_data, allow_redirects=False)
print(f"Step 1 status: {response.status_code}")

if response.status_code == 302:
    next_url = response.headers.get('Location', '')
    print(f"Redirect URL: {next_url}")
    
    # Follow redirect
    full_url = BASE_URL + next_url if next_url.startswith('/') else next_url
    response = session.get(full_url)
    
    print(f"\nPassword page URL: {response.url}")
    print(f"Status: {response.status_code}")
    
    # Parse password page
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Find ALL form elements
    forms = soup.find_all('form')
    print(f"\n=== FORMS FOUND: {len(forms)} ===\n")
    
    for i, form in enumerate(forms):
        print(f"Form {i+1}:")
        print(f"  Action: {form.get('action', 'NONE')}")
        print(f"  Method: {form.get('method', 'GET')}")
        print(f"  ID: {form.get('id', 'NONE')}")
        
        inputs = form.find_all('input')
        print(f"  Inputs ({len(inputs)}):")
        for inp in inputs:
            name = inp.get('name', 'NO NAME')
            inp_type = inp.get('type', 'NO TYPE')
            inp_id = inp.get('id', 'NO ID')
            value = inp.get('value', '')
            
            if len(value) > 80:
                value = value[:80] + "..."
            
            print(f"    - {name:45} Type: {inp_type:12} ID: {inp_id}")
        print()
    
    # Save HTML
    with open('password_page_full.html', 'w', encoding='utf-8') as f:
        f.write(response.text)
    print("\n✅ Saved to password_page_full.html")
