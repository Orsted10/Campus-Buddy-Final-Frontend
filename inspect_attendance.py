import requests
from bs4 import BeautifulSoup

# Your cookies
COOKIES = {
    'ASP.NET_SessionId': 'xn4450x0tiboptbg2k1qmigq',
    'UIMSLoginCookie4/4/2026': '5UEoMJNbNYoKyTkYkVG+kg==',
}

BASE_URL = 'https://student.culko.in'

def inspect_attendance_page():
    """Inspect attendance page structure"""
    session = requests.Session()
    session.cookies.update(COOKIES)
    
    url = f'{BASE_URL}/frmStudentCourseWiseAttendanceSummary.aspx?type=etgkYfqBdH1fSfc255iYGw=='
    response = session.get(url)
    
    print(f"Status: {response.status_code}")
    
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Find all tables
    tables = soup.find_all('table')
    print(f"\n=== TABLES FOUND: {len(tables)} ===\n")
    
    for i, table in enumerate(tables):
        table_id = table.get('id', 'No ID')
        table_class = table.get('class', ['No class'])
        
        print(f"Table {i+1}:")
        print(f"  ID: {table_id}")
        print(f"  Class: {table_class}")
        
        # Show first few rows
        rows = table.find_all('tr')[:3]
        print(f"  Rows (first 3):")
        for j, row in enumerate(rows):
            cells = row.find_all(['td', 'th'])
            cell_texts = [cell.get_text(strip=True)[:50] for cell in cells]
            print(f"    Row {j}: {cell_texts}")
        print()
    
    # Save HTML
    with open('attendance_structure.html', 'w', encoding='utf-8') as f:
        f.write(response.text)
    print("✅ Saved to attendance_structure.html")

if __name__ == '__main__':
    inspect_attendance_page()
