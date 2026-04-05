"""
CULKO Student Portal Scraper
Adapted for Chandigarh University Lucknow Campus (student.culko.in)

NOTE: Due to CAPTCHA on login, users must manually login and provide session cookies.
"""

import requests
from bs4 import BeautifulSoup
import json
from typing import Dict, List, Optional

BASE_URL = "https://student.culko.in"

class CULKOSession:
    def __init__(self, cookies: Dict):
        """Initialize with pre-authenticated session cookies"""
        self.session = requests.Session()
        self.session.cookies.update(cookies)
        self._attendance = None
        self._marks = None
        self._timetable = None
        self._profile = None
    
    @classmethod
    def from_cookie_file(cls, filepath: str):
        """Load session from saved cookie file"""
        with open(filepath, 'r') as f:
            cookies = json.load(f)
        return cls(cookies)
    
    def _make_request(self, url: str, params: Dict = None, data: Dict = None) -> requests.Response:
        """Make authenticated request"""
        full_url = BASE_URL + url if url.startswith('/') else url
        response = self.session.get(full_url, params=params)
        
        if response.status_code != 200:
            raise Exception(f"Request failed: {response.status_code}")
        
        return response
    
    def get_profile(self) -> Dict:
        """Fetch student profile information"""
        if self._profile:
            return self._profile
        
        # Try common profile endpoints
        profile_urls = [
            '/StudentProfile.aspx',
            '/frmStudentProfile.aspx',
            '/Profile.aspx'
        ]
        
        for url in profile_urls:
            try:
                response = self._make_request(url)
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Look for profile data in various formats
                profile_data = self._extract_profile(soup)
                if profile_data:
                    self._profile = profile_data
                    return profile_data
            except:
                continue
        
        raise Exception("Could not fetch profile")
    
    def _extract_profile(self, soup: BeautifulSoup) -> Optional[Dict]:
        """Extract profile data from HTML"""
        profile = {}
        
        # Try to find name
        name_elem = soup.find(['div', 'span'], class_=lambda x: x and ('name' in x.lower() or 'user' in x.lower()))
        if name_elem:
            profile['name'] = name_elem.get_text(strip=True)
        
        # Try to find student ID
        id_elem = soup.find(text=lambda t: t and '25LBCS' in str(t))
        if id_elem:
            profile['student_id'] = id_elem.strip()
        
        return profile if profile else None
    
    def get_attendance(self) -> List[Dict]:
        """Fetch attendance data"""
        if self._attendance:
            return self._attendance
        
        # Try common attendance endpoints
        attendance_urls = [
            '/Attendance.aspx',
            '/frmStudentCourseWiseAttendanceSummary.aspx',
            '/StudentAttendance.aspx'
        ]
        
        for url in attendance_urls:
            try:
                response = self._make_request(url)
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Look for attendance table
                attendance_data = self._extract_attendance(soup)
                if attendance_data:
                    self._attendance = attendance_data
                    return attendance_data
            except:
                continue
        
        raise Exception("Could not fetch attendance")
    
    def _extract_attendance(self, soup: BeautifulSoup) -> Optional[List[Dict]]:
        """Extract attendance from HTML table"""
        # Find attendance table
        table = soup.find('table', class_=lambda x: x and ('attendance' in x.lower() or 'grid' in x.lower()))
        
        if not table:
            return None
        
        subjects = []
        rows = table.find_all('tr')[1:]  # Skip header
        
        for row in rows:
            cells = row.find_all('td')
            if len(cells) >= 3:
                subject = {
                    'name': cells[0].get_text(strip=True),
                    'attended': cells[1].get_text(strip=True),
                    'total': cells[2].get_text(strip=True),
                    'percentage': cells[3].get_text(strip=True) if len(cells) > 3 else None
                }
                subjects.append(subject)
        
        return subjects if subjects else None
    
    def get_marks(self) -> List[Dict]:
        """Fetch marks/grades data"""
        if self._marks:
            return self._marks
        
        # Try common marks endpoints
        marks_urls = [
            '/Marks.aspx',
            '/frmStudentMarksView.aspx',
            '/Results.aspx',
            '/Grades.aspx'
        ]
        
        for url in marks_urls:
            try:
                response = self._make_request(url)
                soup = BeautifulSoup(response.text, 'html.parser')
                
                marks_data = self._extract_marks(soup)
                if marks_data:
                    self._marks = marks_data
                    return marks_data
            except:
                continue
        
        raise Exception("Could not fetch marks")
    
    def _extract_marks(self, soup: BeautifulSoup) -> Optional[List[Dict]]:
        """Extract marks from HTML"""
        # Look for marks table
        tables = soup.find_all('table')
        
        for table in tables:
            # Check if this looks like a marks table
            headers = table.find_all('th')
            header_texts = [h.get_text(strip=True).lower() for h in headers]
            
            if any(keyword in ' '.join(header_texts) for keyword in ['subject', 'marks', 'grade', 'course']):
                marks = []
                rows = table.find_all('tr')[1:]
                
                for row in rows:
                    cells = row.find_all('td')
                    if cells:
                        mark_data = {
                            'subject': cells[0].get_text(strip=True) if len(cells) > 0 else '',
                            'marks': cells[1].get_text(strip=True) if len(cells) > 1 else '',
                            'grade': cells[2].get_text(strip=True) if len(cells) > 2 else ''
                        }
                        marks.append(mark_data)
                
                return marks if marks else None
        
        return None
    
    def get_timetable(self) -> Dict:
        """Fetch timetable data"""
        if self._timetable:
            return self._timetable
        
        # Try timetable endpoints
        timetable_urls = [
            '/Timetable.aspx',
            '/frmMyTimeTable.aspx',
            '/StudentTimetable.aspx'
        ]
        
        for url in timetable_urls:
            try:
                response = self._make_request(url)
                soup = BeautifulSoup(response.text, 'html.parser')
                
                timetable_data = self._extract_timetable(soup)
                if timetable_data:
                    self._timetable = timetable_data
                    return timetable_data
            except:
                continue
        
        raise Exception("Could not fetch timetable")
    
    def _extract_timetable(self, soup: BeautifulSoup) -> Optional[Dict]:
        """Extract timetable from HTML"""
        table = soup.find('table', id=lambda x: x and ('timetable' in x.lower() or 'schedule' in x.lower()))
        
        if not table:
            return None
        
        # Parse timetable structure
        timetable = {}
        rows = table.find_all('tr')
        
        for row in rows:
            cells = row.find_all('td')
            if cells:
                day = cells[0].get_text(strip=True)
                if day:
                    timetable[day] = [cell.get_text(strip=True) for cell in cells[1:]]
        
        return timetable if timetable else None


# Example usage
if __name__ == "__main__":
    print("CULKO Scraper - Manual Login Required")
    print("\nInstructions:")
    print("1. Login to https://student.culko.in manually")
    print("2. Open DevTools → Application → Cookies")
    print("3. Copy all cookies and save as culko_cookies.json")
    print("4. Run this script to test scraping")
    
    try:
        scraper = CULKOSession.from_cookie_file('culko_cookies.json')
        
        print("\n✅ Testing profile fetch...")
        profile = scraper.get_profile()
        print(json.dumps(profile, indent=2))
        
    except FileNotFoundError:
        print("\n❌ Cookie file not found. Please login and export cookies first.")
    except Exception as e:
        print(f"\n❌ Error: {e}")
