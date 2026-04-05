import requests

cookies = {
    'ASP.NET_SessionId': 'yuxqvvxmfizi1pldwhg1u2el',
    'UIMSLoginCookie4/4/2026': '5UEoMJNbNYoKyTkYkVG+kg==',
}

r = requests.get('https://student.culko.in/frmStudentCourseWiseAttendanceSummary.aspx?type=etgkYfqBdH1fSfc255iYGw==', cookies=cookies)

# Check for JSON data in page
if '"d":' in r.text or 'JSON.parse' in r.text:
    print("✅ Page contains JSON data")
    
    # Look for GetReport endpoint
    if 'GetReport' in r.text:
        print("✅ Found GetReport endpoint")
        
        # Extract report ID and session
        import re
        uid_match = re.search(r"getReport\('([^']+)'", r.text)
        session_match = re.search(r"CurrentSession\((\d+)\)", r.text)
        
        if uid_match and session_match:
            report_id = uid_match.group(1)
            session_id = session_match.group(1)
            
            print(f"Report ID: {report_id}")
            print(f"Session ID: {session_id}")
            
            # Call the JSON endpoint
            json_url = 'https://student.culko.in/frmStudentCourseWiseAttendanceSummary.aspx/GetReport'
            headers = {'Content-Type': 'application/json'}
            data = f"{{UID:'{report_id}',Session:'{session_id}'}}"
            
            json_response = requests.post(json_url, headers=headers, data=data, cookies=cookies)
            
            print(f"\nJSON Response Status: {json_response.status_code}")
            print(f"Response length: {len(json_response.text)}")
            
            if json_response.status_code == 200:
                import json
                try:
                    parsed = json.loads(json_response.text)
                    attendance_data = json.loads(parsed['d'])
                    print(f"\n✅ Parsed {len(attendance_data)} attendance records")
                    
                    for record in attendance_data[:3]:
                        print(f"  - {record.get('Title', 'N/A')}: {record.get('TotalPercentage', 'N/A')}%")
                except Exception as e:
                    print(f"Error parsing JSON: {e}")
                    print(f"Raw response: {json_response.text[:500]}")
else:
    print("❌ No JSON data found in page")
    print("Page might use server-side rendering")
