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
    'submit': 'NEXT'
}

response = session.post(LOGIN_URL, data=step1_data, allow_redirects=False)

if response.status_code == 302:
    next_url = response.headers.get('Location', '')
    response = session.get(BASE_URL + next_url if next_url.startswith('/') else next_url)

# Save password page HTML
with open('password_page.html', 'w', encoding='utf-8') as f:
    f.write(response.text)

print("Password page HTML saved to password_page.html")
print(f"\nURL: {response.url}")
print(f"Status: {response.status_code}")

# Parse and show all inputs
soup = BeautifulSoup(response.text, 'html.parser')
inputs = soup.find_all('input')

print(f"\n=== INPUT FIELDS ON PASSWORD PAGE ({len(inputs)}) ===\n")
for inp in inputs:
    name = inp.get('name', 'NO NAME')
    inp_type = inp.get('type', 'NO TYPE')
    value = inp.get('value', '')
    
    if len(value) > 50:
        value = value[:50] + "..."
    
    print(f"Name: {name:40} Type: {inp_type:15} Value: {value}")
