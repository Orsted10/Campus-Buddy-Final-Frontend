import requests
from bs4 import BeautifulSoup
import json

# Your cookies from DevTools
COOKIES = {
    'ASP.NET_SessionId': 'xn4450x0tiboptbg2k1qmigq',
    'UIMSLoginCookie4/4/2026': '5UEoMJNbNYoKyTkYkVG+kg==',
    # Add any other authentication cookies here
}

BASE_URL = 'https://student.culko.in'

def discover_endpoints():
    """Try to find all available pages by crawling the home page"""
    session = requests.Session()
    session.cookies.update(COOKIES)
    
    # First, fetch the home page
    print("Fetching student home page...")
    response = session.get(f'{BASE_URL}/StudentHome.aspx')
    
    if response.status_code != 200:
        print(f"❌ Failed to load home page: {response.status_code}")
        return
    
    print("✅ Home page loaded")
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Find ALL links
    all_links = soup.find_all('a', href=True)
    print(f"\n=== FOUND {len(all_links)} LINKS ===\n")
    
    # Categorize links
    categories = {
        'attendance': [],
        'marks': [],
        'timetable': [],
        'profile': [],
        'academic': [],
        'other': []
    }
    
    for link in all_links:
        href = link['href']
        text = link.get_text(strip=True).lower()
        
        # Skip javascript links and empty
        if href.startswith('javascript:') or not href.strip():
            continue
        
        # Categorize
        if any(kw in href.lower() or kw in text for kw in ['attendance', 'present']):
            categories['attendance'].append((text, href))
        elif any(kw in href.lower() or kw in text for kw in ['mark', 'grade', 'result', 'score']):
            categories['marks'].append((text, href))
        elif any(kw in href.lower() or kw in text for kw in ['time', 'schedule', 'calendar']):
            categories['timetable'].append((text, href))
        elif any(kw in href.lower() or kw in text for kw in ['profile', 'account', 'detail']):
            categories['profile'].append((text, href))
        elif any(kw in href.lower() or kw in text for kw in ['academic', 'course', 'subject']):
            categories['academic'].append((text, href))
        else:
            categories['other'].append((text, href))
    
    # Print results
    for category, links in categories.items():
        if links:
            print(f"\n📁 {category.upper()} ({len(links)}):")
            for text, href in links[:10]:  # Show first 10
                full_url = href if href.startswith('http') else BASE_URL + '/' + href.lstrip('./')
                print(f"  • {text or 'No text'}")
                print(f"    → {full_url}")
    
    # Also check for iframes (common in ASP.NET portals)
    iframes = soup.find_all('iframe', src=True)
    if iframes:
        print(f"\n🖼️  IFRAMES FOUND ({len(iframes)}):")
        for iframe in iframes:
            src = iframe['src']
            print(f"  • {src}")
    
    # Check for menu items
    menus = soup.find_all(['ul', 'div'], class_=lambda x: x and ('menu' in x.lower() or 'nav' in x.lower()))
    if menus:
        print(f"\n📋 MENU STRUCTURES FOUND ({len(menus)})")
    
    # Save full HTML for manual inspection
    with open('home_page_structure.html', 'w', encoding='utf-8') as f:
        f.write(response.text)
    print("\n✅ Full HTML saved to home_page_structure.html")

if __name__ == '__main__':
    discover_endpoints()
