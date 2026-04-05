# Implementation Plan: CULKO Portal Scraper

## Overview

Implement the CULKO portal scraper feature in TypeScript/Node.js using Playwright for browser automation, Supabase for session and data persistence, and Next.js 16 App Router route handlers. The existing `app/api/culko/route.ts` and `lib/culko/scraper.ts` will be replaced by the new implementation.

## Tasks

- [x] 1. Database setup — add Supabase tables and types
  - [x] 1.1 Write and run SQL migration to create `culko_sessions` and `culko_data` tables with RLS policies
    - Create `culko_sessions` (id, encrypted_cookies, iv, expires_at, timestamps)
    - Create `culko_data` (id, profile, marks, attendance, results, hostel, timetable, courses, last_scraped_at, timestamps)
    - Add RLS policies: users can only SELECT/INSERT/UPDATE/DELETE their own rows
    - _Requirements: 8.3, 8.4_
  - [x] 1.2 Extend `types/database.ts` with `CulkoSession`, `CulkoDataRecord`, and all scraped data interfaces
    - Add `StudentProfile`, `AttendanceRecord`, `MarkRecord`, `ResultRecord`, `HostelRecord`, `TimetableRecord`, `CourseRecord`
    - _Requirements: 5.1_

- [x] 2. Session encryption utility
  - [x] 2.1 Create `lib/culko/session-manager.ts` with AES-256-GCM encrypt/decrypt functions
    - `encrypt(plaintext: string): { ciphertext: string; iv: string }`
    - `decrypt(ciphertext: string, iv: string): string`
    - Read key from `process.env.CULKO_ENCRYPTION_KEY` (32-byte hex); throw at module load if missing
    - _Requirements: 8.2_
  - [x] 2.2 Write property test for encryption round-trip
    - **Property 2: Encryption round-trip** — for any string, `decrypt(encrypt(x)) === x`
    - Use `fast-check` with minimum 100 iterations
    - **Validates: Requirements 4.3, 8.2**

- [x] 3. HTML parsers for all 7 portal pages
  - [x] 3.1 Create `lib/culko/parsers/profile.ts` — parse `frmStudentProfile.aspx` HTML into `StudentProfile`
    - Extract name, UID, program, semester, section, email, phone from label/value pairs
    - _Requirements: 5.2_
  - [x] 3.2 Create `lib/culko/parsers/marks.ts` — parse `frmStudentMarksView.aspx` HTML into `MarkRecord[]`
    - Handle accordion structure (subject headers + nested tables)
    - _Requirements: 5.2_
  - [x] 3.3 Create `lib/culko/parsers/attendance.ts` — parse attendance summary HTML into `AttendanceRecord[]`
    - Compute `percentage = total > 0 ? Math.round((attended / total) * 100) : 0`
    - _Requirements: 5.2_
  - [x] 3.4 Write property test for attendance percentage invariant
    - **Property 4: Attendance percentage invariant** — for any `{ attended, total }` where `total >= attended >= 0`, assert percentage formula
    - **Validates: Requirements 5.2**
  - [x] 3.5 Create `lib/culko/parsers/results.ts` — parse `result.aspx` HTML into `ResultRecord[]`
    - Extract SGPA, CGPA, subject grades per semester
    - _Requirements: 5.2_
  - [x] 3.6 Create `lib/culko/parsers/hostel.ts` — parse `frmStudenHostelDetails.aspx` HTML into `HostelRecord`
    - _Requirements: 5.2_
  - [x] 3.7 Create `lib/culko/parsers/timetable.ts` — parse `frmMyTimeTable.aspx` HTML into `TimetableRecord[]`
    - _Requirements: 5.2_
  - [x] 3.8 Create `lib/culko/parsers/courses.ts` — parse `frmMyCourse.aspx` HTML into `CourseRecord[]`
    - _Requirements: 5.2_
  - [x] 3.9 Write property tests for parser non-null output
    - **Property 5: Parser non-null output** — for any structurally valid HTML variant, each parser returns an object with no `undefined` required fields
    - Use `fast-check` to generate HTML variants (with/without optional fields)
    - **Validates: Requirements 5.2**

- [x] 4. Portal scraper
  - [x] 4.1 Rewrite `lib/culko/scraper.ts` — `PortalScraper` class that fetches all 7 pages and calls parsers
    - `scrapeAll(cookies: Record<string, string>): Promise<ScrapeResult>`
    - Use `fetch` with cookie header; detect login redirect (URL contains `Login.aspx`)
    - On non-200 or redirect: mark that source as `null`, continue with remaining pages
    - Record `last_scraped_at` timestamp
    - _Requirements: 5.1, 5.2, 5.3, 5.5_
  - [x] 4.2 Write property test for partial-failure isolation
    - **Property 6: Scrape partial-failure isolation** — for any subset of the 7 URLs that return non-200, the remaining pages still return parsed data
    - Mock `fetch` to fail for a random subset; assert successful pages have non-null data
    - **Validates: Requirements 5.3**

- [x] 5. Login orchestrator
  - [x] 5.1 Create `lib/culko/login-orchestrator.ts` with in-memory pending session map
    - `startLogin(uid, password): Promise<{ sessionToken, captchaImage }>` — launches Playwright, fills UID+password, captures CAPTCHA as base64 PNG
    - `refreshCaptcha(sessionToken): Promise<{ captchaImage }>` — clicks refresh button, captures new CAPTCHA
    - `submitCaptcha(sessionToken, solution): Promise<{ cookies } | { captchaImage, error }>` — fills CAPTCHA, clicks Login, extracts cookies on success or returns fresh CAPTCHA on wrong answer
    - `cleanupSession(sessionToken)` — closes browser, removes from map
    - TTL cleanup: close sessions older than 5 minutes
    - Export `runtime = 'nodejs'` hint for consumers
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.4, 4.1, 4.2, 4.4, 4.6_
  - [x] 5.2 Write property test for browser cleanup
    - **Property 9: Browser cleanup after login** — for any login outcome (success or failure), the session token should not remain in the pending sessions map after the operation completes
    - **Validates: Requirements 4.6**
  - [x] 5.3 Write property test for CAPTCHA refresh uniqueness
    - **Property 8: CAPTCHA refresh produces new image** — for any active session, the image returned by `refreshCaptcha` differs from the previously returned image
    - Mock Playwright page screenshots to return distinct buffers
    - **Validates: Requirements 3.4**

- [ ] 6. API route handlers
  - [ ] 6.1 Create `app/api/culko/login/route.ts` — POST handler
    - Validate `{ uid, password }` body (non-empty strings)
    - Call `startLogin`, return `{ sessionToken, captchaImage }`
    - Set `export const runtime = 'nodejs'` and `export const maxDuration = 120`
    - _Requirements: 1.2, 2.1, 3.1, 3.2_
  - [x] 6.2 Create `app/api/culko/captcha/route.ts` — POST handler
    - Validate `{ sessionToken, captchaSolution }` body
    - Call `submitCaptcha`; on success: encrypt cookies via `SessionManager`, upsert to `culko_sessions`, trigger `scrapeAll`, upsert to `culko_data`, return `{ success: true }`
    - On wrong CAPTCHA: return `{ captchaImage, error }` with HTTP 422
    - Set `export const runtime = 'nodejs'` and `export const maxDuration = 120`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.4_
  - [x] 6.3 Create `app/api/culko/data/route.ts` — GET handler
    - Read authenticated user from Supabase session (use `@supabase/ssr` server client)
    - Query `culko_data` for the user's row; return the JSON
    - Return `{ connected: false }` if no row exists
    - _Requirements: 6.1–6.9, 7.2_
  - [x] 6.4 Create `app/api/culko/scrape/route.ts` — POST handler
    - Read session from `culko_sessions`, decrypt cookies
    - Call `scrapeAll`; detect session expiry (redirect to login)
    - On expiry: update `culko_sessions` to mark expired, return `{ sessionExpired: true }`
    - On success: upsert `culko_data`, return `{ success: true, last_scraped_at }`
    - _Requirements: 7.3, 7.4_
  - [x] 6.5 Create `app/api/culko/disconnect/route.ts` — POST handler
    - Delete rows from `culko_sessions` and `culko_data` for the authenticated user
    - Return `{ success: true }`
    - _Requirements: 8.5_
  - [~] 6.6 Write property test for disconnect completeness
    - **Property 7: Disconnect completeness** — after disconnect, querying both tables for the user's ID returns zero rows
    - Use Supabase test client with a seeded user
    - **Validates: Requirements 8.5**

- [~] 7. Checkpoint — ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Frontend — login form component
  - [~] 8.1 Create `components/culko/CulkoLoginForm.tsx` (Client Component)
    - Step 1: UID + password form with validation (non-empty, whitespace rejection)
    - Step 2: Display base64 CAPTCHA image + solution input + Refresh button
    - On submit: POST to `/api/culko/login`, then POST to `/api/culko/captcha`
    - Show loading states and error messages at each step
    - _Requirements: 1.1, 1.2, 1.4, 3.3, 3.4, 3.5_
  - [~] 8.2 Create `components/culko/CulkoStatusBadge.tsx` (Client Component)
    - Show "Connected — last updated X minutes ago" or "Not connected"
    - _Requirements: 7.5_
  - [~] 8.3 Create `components/culko/CulkoDataView.tsx` (Client Component)
    - Tabbed view: Attendance | Marks | Results | Profile | Timetable | Hostel | Courses
    - Fetch from `/api/culko/data` on mount; show loading indicator while fetching
    - Show "Connect your portal" prompt when `connected: false`
    - Trigger `/api/culko/scrape` on mount when session exists (background refresh)
    - _Requirements: 6.1–6.9, 7.2, 7.3_

- [ ] 9. Wire into dashboard
  - [~] 9.1 Replace `CULKOConnectionManager` in `app/dashboard/academics/culko-connection.tsx` with `CulkoLoginForm` and `CulkoDataView`
    - Remove the old Python-based login methods (monitor, automated, manual cookies)
    - _Requirements: 1.1, 6.1–6.9_
  - [~] 9.2 Add `CULKO_ENCRYPTION_KEY` to `.env.local.example` with a placeholder and instructions
    - Document how to generate a 32-byte hex key: `openssl rand -hex 32`
    - _Requirements: 8.2_

- [~] 10. Final checkpoint — ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- `fast-check` must be installed: `npm install --save-dev fast-check`
- `playwright` must be installed: `npm install playwright` + `npx playwright install chromium`
- The existing `app/api/culko/route.ts` should be deleted once the new routes are in place (task 6)
- All route handlers use `export const runtime = 'nodejs'` — Playwright cannot run on the Edge runtime
- `params` in dynamic routes is a Promise in Next.js 16 — always `await params`
- `cookies()` from `next/headers` is async in Next.js 15+ — always `await cookies()`
