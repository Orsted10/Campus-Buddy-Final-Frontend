import requests
from bs4 import BeautifulSoup

cookies = {
    'ASP.NET_SessionId': 'xn4450x0tiboptbg2k1qmigq',
    'UIMSLoginCookie4/4/2026': '5UEoMJNbNYoKyTkYkVG+kg==',
}

r = requests.get('https://student.culko.in/frmStudentCourseWiseAttendanceSummary.aspx?type=etgkYfqBdH1fSfc255iYGw==', cookies=cookies)
soup = BeautifulSoup(r.text, 'html.parser')
rows = soup.find_all('tr')

print(f'Total rows: {len(rows)}\n')

for i, row in enumerate(rows[:5]):
    cells = row.find_all('td')
    if cells:
        texts = [td.get_text(strip=True)[:40] for td in cells[:4]]
        print(f'Row {i}: {texts}')
