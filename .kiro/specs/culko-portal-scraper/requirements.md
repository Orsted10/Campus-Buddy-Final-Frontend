# Requirements Document

## Introduction

The CULKO Portal Scraper feature enables students to connect their Chandigarh University Lucknow (CULKO) student portal account to the campus app. The system automates the multi-step login process (UID → password → CAPTCHA), presents the CAPTCHA image to the user for manual solving, completes the login, and then scrapes academic data including marks, attendance, profile, timetable, hostel info, and enrolled courses. Scraped data is persisted in Supabase and kept up-to-date via background session refresh, so users do not need to re-login on every visit.

## Glossary

- **Portal**: The CULKO student portal at `student.culko.in`
- **Scraper**: The server-side component responsible for fetching and parsing HTML from Portal pages
- **Session**: The authenticated browser session represented by ASP.NET cookies (`ASP.NET_SessionId`, `.ASPXAUTH`, etc.)
- **CAPTCHA_Image**: The image element rendered by the Portal during login that the user must read and solve
- **Scraped_Data**: The structured academic data extracted from Portal pages (profile, marks, attendance, timetable, hostel, courses, results)
- **Session_Store**: The Supabase table that persists encrypted session cookies per user
- **Data_Cache**: The Supabase tables that store the most recently scraped Scraped_Data per user
- **Background_Refresh**: A server-side process that re-uses stored Session cookies to re-scrape Portal pages and update Data_Cache
- **Login_Flow**: The multi-step sequence: enter UID → click Next → enter password → solve CAPTCHA → click Login
- **Playwright**: The Node.js browser automation library used to drive the Login_Flow headlessly

## Requirements

### Requirement 1: Credential Collection

**User Story:** As a student, I want to enter my CULKO UID and password in the app, so that the system can begin the automated login process on my behalf.

#### Acceptance Criteria

1. THE App SHALL display a login form with a UID input field and a password input field.
2. WHEN a user submits the form with an empty UID or empty password, THE App SHALL prevent submission and display a validation error message.
3. WHEN a user submits valid credentials, THE App SHALL transmit the UID and password to the Login_API over HTTPS without logging them to any persistent store.
4. THE App SHALL mask the password field so the password is not visible in plaintext.

---

### Requirement 2: Automated Login Orchestration

**User Story:** As a student, I want the system to automatically fill in my UID and password on the Portal, so that I don't have to interact with the Portal directly.

#### Acceptance Criteria

1. WHEN the Login_API receives a UID and password, THE Login_API SHALL launch a Playwright browser instance in headless mode and navigate to `https://student.culko.in/Login.aspx`.
2. WHEN the login page loads, THE Login_API SHALL locate the UID input field, fill it with the provided UID, and click the Next button.
3. WHEN the password page loads after clicking Next, THE Login_API SHALL locate the password input field and fill it with the provided password.
4. IF the UID input field, Next button, or password input field cannot be located within 15 seconds, THEN THE Login_API SHALL return an error response with a descriptive message.
5. THE Login_API SHALL NOT store the UID or password after the login attempt completes.

---

### Requirement 3: CAPTCHA Relay

**User Story:** As a student, I want to see the CAPTCHA image from the Portal inside the app, so that I can solve it without leaving the app.

#### Acceptance Criteria

1. WHEN the password page is loaded and the CAPTCHA image element is present, THE Login_API SHALL capture the CAPTCHA image as a base64-encoded PNG.
2. THE Login_API SHALL return the base64 CAPTCHA image and a session token to the App so the browser session is held open awaiting the solution.
3. THE App SHALL display the CAPTCHA image to the user with an input field for the solution.
4. THE App SHALL provide a "Refresh CAPTCHA" button that requests a new CAPTCHA image from the Login_API without restarting the entire Login_Flow.
5. WHEN the user submits a CAPTCHA solution, THE App SHALL send the solution and session token to the Login_API.

---

### Requirement 4: Login Completion

**User Story:** As a student, I want the system to complete the login after I solve the CAPTCHA, so that a valid session is established.

#### Acceptance Criteria

1. WHEN the Login_API receives a CAPTCHA solution, THE Login_API SHALL enter the solution into the CAPTCHA input field and click the Login button.
2. WHEN login succeeds (browser navigates away from the login page to a home/dashboard page), THE Login_API SHALL extract all session cookies from the browser.
3. WHEN login succeeds, THE Login_API SHALL encrypt the session cookies and store them in the Session_Store associated with the authenticated app user.
4. IF the CAPTCHA solution is incorrect (Portal shows a CAPTCHA error), THEN THE Login_API SHALL capture a fresh CAPTCHA image and return it to the App so the user can try again.
5. IF login fails for any reason other than an incorrect CAPTCHA (e.g., wrong password), THEN THE Login_API SHALL return a descriptive error message to the App.
6. THE Login_API SHALL close the Playwright browser instance after login completes or fails.

---

### Requirement 5: Data Scraping

**User Story:** As a student, I want the system to automatically fetch my academic data from the Portal after login, so that I can view it in the app.

#### Acceptance Criteria

1. WHEN a valid Session is available, THE Scraper SHALL fetch and parse data from the following Portal pages:
   - `https://student.culko.in/frmStudentProfile.aspx` (personal profile)
   - `https://student.culko.in/frmStudentMarksView.aspx` (internal marks)
   - `https://student.culko.in/frmStudentCourseWiseAttendanceSummary.aspx?type=etgkYfqBdH1fSfc255iYGw==` (subject-wise attendance)
   - `https://student.culko.in/result.aspx` (end-term results / CGPA)
   - `https://student.culko.in/frmStudenHostelDetails.aspx` (hostel information)
   - `https://student.culko.in/frmMyTimeTable.aspx` (timetable)
   - `https://student.culko.in/frmMyCourse.aspx` (enrolled courses)
2. WHEN a Portal page returns HTTP 200, THE Scraper SHALL parse the HTML and extract structured Scraped_Data.
3. WHEN a Portal page returns a non-200 HTTP status or redirects to the login page, THE Scraper SHALL mark that data source as unavailable and continue scraping remaining pages.
4. THE Scraper SHALL store all successfully parsed Scraped_Data in the Data_Cache in Supabase, associated with the authenticated app user.
5. WHEN Scraped_Data is stored, THE Scraper SHALL record a `last_scraped_at` timestamp alongside the data.

---

### Requirement 6: Data Display

**User Story:** As a student, I want to view my scraped academic data in the app dashboard, so that I can check my attendance, marks, results, and other information without visiting the Portal.

#### Acceptance Criteria

1. THE App SHALL display subject-wise attendance with attended classes, total classes, and percentage for each subject.
2. THE App SHALL display internal marks per subject.
3. THE App SHALL display end-term results and CGPA from the results page.
4. THE App SHALL display the student's personal profile information.
5. THE App SHALL display the weekly timetable.
6. THE App SHALL display hostel details.
7. THE App SHALL display enrolled courses.
8. WHEN data is loading, THE App SHALL display a loading indicator.
9. WHEN no Scraped_Data exists for a section, THE App SHALL display a prompt to connect the Portal account.

---

### Requirement 7: Session Persistence and Background Refresh

**User Story:** As a student, I want my Portal data to stay up-to-date without having to log in again every time, so that I always see current information.

#### Acceptance Criteria

1. THE Session_Store SHALL persist encrypted session cookies in Supabase, associated with the app user's ID, with a stored expiry timestamp.
2. WHEN the App loads and a valid Session exists in the Session_Store, THE App SHALL display cached Scraped_Data immediately without requiring re-login.
3. WHEN the App loads and a valid Session exists, THE Background_Refresh SHALL attempt to re-scrape all Portal pages and update the Data_Cache.
4. WHEN a scrape attempt detects that the Session has expired (Portal redirects to login page), THE Background_Refresh SHALL mark the session as expired in the Session_Store and notify the App to prompt the user to re-login.
5. THE App SHALL display the `last_scraped_at` timestamp so the user knows how recent the data is.

---

### Requirement 8: Security and Privacy

**User Story:** As a student, I want my credentials and session data to be handled securely, so that my Portal account is not compromised.

#### Acceptance Criteria

1. THE Login_API SHALL transmit credentials only over HTTPS and SHALL NOT persist the UID or password anywhere after the login attempt.
2. THE Session_Store SHALL encrypt session cookies at rest using AES-256 encryption before storing them in Supabase.
3. THE Session_Store SHALL enforce Row Level Security so that a user can only read and write their own session record.
4. THE Data_Cache tables SHALL enforce Row Level Security so that a user can only read their own Scraped_Data.
5. WHEN a user disconnects their Portal account, THE App SHALL delete the session record and all associated Scraped_Data from Supabase.
