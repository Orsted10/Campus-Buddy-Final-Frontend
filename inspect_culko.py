import requests
from bs4 import BeautifulSoup

BASE_URL = "https://student.culko.in"
LOGIN_URL = BASE_URL + "/Login.aspx"

def inspect_login_page():
    session = requests.Session()
    
    print("Fetching login page...")
    response = session.get(LOGIN_URL)
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Find all input fields
    inputs = soup.find_all('input')
    print(f"\n=== ALL INPUT FIELDS ({len(inputs)}) ===\n")
    
    for i, inp in enumerate(inputs):
        name = inp.get('name', 'NO NAME')
        inp_type = inp.get('type', 'NO TYPE')
        inp_id = inp.get('id', 'NO ID')
        value = inp.get('value', '')
        
        if len(value) > 50:
            value = value[:50] + "..."
        
        print(f"{i+1}. Name: {name}")
        print(f"   Type: {inp_type}")
        print(f"   ID: {inp_id}")
        print(f"   Value: {value}")
        print()
    
    # Find all buttons
    buttons = soup.find_all(['button', 'input'], attrs={'type': 'submit'})
    print(f"\n=== SUBMIT BUTTONS ({len(buttons)}) ===\n")
    for btn in buttons:
        print(f"Name: {btn.get('name')}")
        print(f"Value: {btn.get('value')}")
        print(f"Text: {btn.get_text(strip=True)}")
        print()
    
    # Save full HTML for manual inspection
    with open('login_page.html', 'w', encoding='utf-8') as f:
        f.write(response.text)
    print("\n✅ Full HTML saved to login_page.html")

if __name__ == "__main__":
    inspect_login_page()
