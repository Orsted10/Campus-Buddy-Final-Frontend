import requests
from bs4 import BeautifulSoup

cookies = {
    'ASP.NET_SessionId': 'yuxqvvxmfizi1pldwhg1u2el',
    'UIMSLoginCookie4/4/2026': '5UEoMJNbNYoKyTkYkVG+kg==',
}

r = requests.get('https://student.culko.in/frmStudentCourseWiseAttendanceSummary.aspx?type=etgkYfqBdH1fSfc255iYGw==', cookies=cookies)
soup = BeautifulSoup(r.text, 'html.parser')

table = soup.find('table', id='SortTable')
print('Table found:', table is not None)

if table:
    rows = table.find_all('tr')
    print(f'Rows: {len(rows)}\n')
    
    for i, row in enumerate(rows[:3]):
        cells = row.find_all('td')
        if cells:
            texts = [td.get_text(strip=True)[:30] for td in cells[:4]]
            print(f'Row {i}: {texts}')
else:
    print('Table NOT found')
    # Check if there's an iframe
    iframes = soup.find_all('iframe')
    print(f'Iframes: {len(iframes)}')
