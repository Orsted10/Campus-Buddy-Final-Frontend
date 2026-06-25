import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import { createClient } from '@/lib/supabase/server'

const BASE_URL = 'https://student.culko.in'

// Helper to extract ASP.NET hidden fields
function extractASPState(html: string) {
  const $ = cheerio.load(html)
  return {
    viewstate: $('#__VIEWSTATE').val() as string || '',
    eventvalidation: $('#__EVENTVALIDATION').val() as string || '',
    viewstategenerator: $('#__VIEWSTATEGENERATOR').val() as string || ''
  }
}

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'

// Helper to extract cookies from response correctly, handling commas in dates
function extractCookies(response: Response): Record<string, string> {
  const setCookieHeaders = response.headers.getSetCookie();
  const jar: Record<string, string> = {}
  
  if (setCookieHeaders && setCookieHeaders.length > 0) {
    setCookieHeaders.forEach(cookieString => {
      const parts = cookieString.split(';')[0].trim().split('=');
      if (parts.length >= 2) {
        const name = parts[0];
        const value = parts.slice(1).join('='); // handle '=' in values
        jar[name] = value;
      }
    });
    return jar;
  }

  // Fallback for older environments
  const setCookie = response.headers.get('set-cookie')
  if (!setCookie) return {}
  
  // Robust split for Set-Cookie header
  const cookies = setCookie.split(/,(?=[^;]*=)/);
  cookies.forEach(c => {
    const pair = c.split(';')[0].trim().split('=')
    if (pair.length >= 2) {
      jar[pair[0]] = pair.slice(1).join('=')
    }
  })
  return jar
}

// Merge cookies
function mergeCookies(existing: Record<string, string>, next: Record<string, string>): Record<string, string> {
  return { ...existing, ...next }
}

// Serialize cookies for fetch
function serializeCookies(jar: Record<string, string>): string {
  return Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ')
}

export async function initCULKOLogin(uid: string) {
  try {
    let jar: Record<string, string> = {}

    // 1. Initial GET
    const initialRes = await fetch(`${BASE_URL}/Login.aspx`, {
      method: 'GET',
      headers: { 'User-Agent': USER_AGENT }
    })
    jar = mergeCookies(jar, extractCookies(initialRes))
    const initialHtml = await initialRes.text()
    const state1 = extractASPState(initialHtml)

    // 2. POST txtUserId
    const formData = new URLSearchParams()
    formData.append('__VIEWSTATE', state1.viewstate)
    formData.append('__EVENTVALIDATION', state1.eventvalidation)
    formData.append('__VIEWSTATEGENERATOR', state1.viewstategenerator)
    formData.append('txtUserId', uid)
    formData.append('btnNext', 'Next')

    const step1Res = await fetch(`${BASE_URL}/Login.aspx`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': serializeCookies(jar),
        'User-Agent': USER_AGENT
      },
      redirect: 'manual'
    })

    const redirectUrl = step1Res.headers.get('location')
    if (!redirectUrl) throw new Error('Failed to get redirect after entering UID')

    jar = mergeCookies(jar, extractCookies(step1Res))

    // 3. GET Redirected Page (Password & Captcha)
    const finalUrl = redirectUrl.startsWith('http') ? redirectUrl : `${BASE_URL}/${redirectUrl}`
    const step2Res = await fetch(finalUrl, {
      method: 'GET',
      headers: {
        'Cookie': serializeCookies(jar),
        'User-Agent': USER_AGENT
      }
    })
    jar = mergeCookies(jar, extractCookies(step2Res))
    const step2Html = await step2Res.text()
    const state2 = extractASPState(step2Html)

    // 4. GET CAPTCHA image
    const captchaRes = await fetch(`${BASE_URL}/GenerateCaptcha.aspx`, {
      headers: {
        'Cookie': serializeCookies(jar),
        'User-Agent': USER_AGENT
      }
    })
    jar = mergeCookies(jar, extractCookies(captchaRes))
    const captchaBuffer = await captchaRes.arrayBuffer()
    const captchaB64 = Buffer.from(captchaBuffer).toString('base64')

    return {
      success: true,
      captchaImg: `data:image/png;base64,${captchaB64}`,
      sessionData: JSON.stringify({ jar, state: state2, url: finalUrl })
    }
  } catch (error) {
    console.error('initCULKOLogin error:', error)
    return { success: false, error: 'Failed to initiate login handshake' }
  }
}

export async function captureBasePortalData(cookieJar: Record<string, string>) {
  console.log('[captureBasePortalData] Starting PARALLEL first-sync sequence...')
  
  const endpoints: ('profile' | 'attendance' | 'marks' | 'hostel')[] = ['profile', 'attendance', 'marks', 'hostel']

  // Fetch ALL endpoints simultaneously instead of one-by-one (3x faster)
  const settled = await Promise.allSettled(
    endpoints.map(async (endpoint) => {
      console.log(`[captureBasePortalData] Fetching ${endpoint}...`)
      const data = await fetchCULKOResource(endpoint, cookieJar)
      await savePortalData(endpoint, data)
      return { endpoint, data }
    })
  )

  const results: Record<string, any> = { profile: null, attendance: [], marks: [], hostel: null }
  for (const result of settled) {
    if (result.status === 'fulfilled') {
      const { endpoint, data } = result.value
      results[endpoint] = data
      console.log(`[captureBasePortalData] ✅ ${endpoint} captured`)
    } else {
      console.error(`[captureBasePortalData] ❌ A capture failed:`, result.reason)
    }
  }

  return results
}

export async function completeCULKOLogin(password: string, captcha: string, sessionData: string) {
  try {
    const { jar, state, url } = JSON.parse(sessionData)

    // POST Final Credentials
    const formData = new URLSearchParams()
    formData.append('__VIEWSTATE', state.viewstate)
    formData.append('__EVENTVALIDATION', state.eventvalidation)
    formData.append('__VIEWSTATEGENERATOR', state.viewstategenerator)
    formData.append('txtLoginPassword', password)
    formData.append('txtcaptcha', captcha)
    formData.append('btnLogin', 'Login')

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': serializeCookies(jar),
        'User-Agent': USER_AGENT,
        'Referer': url
      },
      redirect: 'manual'
    })

    let finalJar = mergeCookies(jar, extractCookies(response))
    let finalHtml = ''
    
    // REDIRECT SEATING: If it redirects (302), we MUST follow it to "activate" the session
    if (response.status === 302 || response.status === 303 || response.status === 200) {
      const redirectUrl = response.headers.get('location')
      const targetUrl = redirectUrl 
        ? (redirectUrl.startsWith('http') ? redirectUrl : `${BASE_URL}/${redirectUrl}`)
        : url
        
      console.log('[completeCULKOLogin] Verifying session at:', targetUrl)
      
      const seatRes = await fetch(targetUrl, {
        headers: {
          'Cookie': serializeCookies(finalJar),
          'User-Agent': USER_AGENT,
          'Referer': url
        }
      })
      finalJar = mergeCookies(finalJar, extractCookies(seatRes))
      finalHtml = await seatRes.text()
    }

    // STEP 1: CHECK FOR ERRORS FIRST (before any success assumption!)
    const hasInvalidCaptcha = finalHtml.includes('Invalid Captcha') || finalHtml.includes('Captcha is wrong') || finalHtml.includes('InvalidCaptcha')
    const hasInvalidPassword = finalHtml.includes('User Id or Password In Correct') || finalHtml.includes('Invalid User ID') || finalHtml.includes('Password In Correct') || finalHtml.includes('UserId or Password InCorrect')

    if (hasInvalidCaptcha) {
      console.log('[completeCULKOLogin] Detected: Invalid CAPTCHA')
      return { success: false, error: 'Invalid CAPTCHA. Please try again.' }
    }
    if (hasInvalidPassword) {
      console.log('[completeCULKOLogin] Detected: Wrong credentials')
      return { success: false, error: 'User ID or Password is incorrect. Please check and try again.' }
    }

    // STEP 2: NOW check for success
    const isDashboard = finalHtml.includes('StudentHome.aspx') || finalHtml.includes('Logout') ||
                        finalHtml.includes('frmStudentCourseWise') || finalHtml.includes('Welcome Student')
    const isLoginPage = finalHtml.includes('id="txtUserId"') || finalHtml.includes('btnLogin')

    const saveSession = async () => {
      const cookieStore = await cookies()
      cookieStore.set('culko_session', JSON.stringify(finalJar), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 // 24 hours
      })
    }

    if (isDashboard) {
      console.log('[completeCULKOLogin] ✅ Dashboard detected — login successful')
      await saveSession()
      return { success: true, cookies: finalJar }
    }
    
    // Strict fallback: Page is not an error and not a login page — likely success
    if (!isLoginPage && !hasInvalidCaptcha && !hasInvalidPassword && finalHtml.length > 1000) {
      console.log('[completeCULKOLogin] ✅ Fallback: not on login page — assuming success')
      await saveSession()
      return { success: true, cookies: finalJar }
    }

    console.log('[completeCULKOLogin] ❌ Login failed — still on login page')
    return { success: false, error: 'Login failed. Please verify your credentials and CAPTCHA.' }
  } catch (error) {
    console.error('completeCULKOLogin error:', error)
    return { success: false, error: 'Connection error during authentication' }
  }
}

interface AttendanceRecord {
  name: string
  code: string
  attended: string
  total: string
  percentage: string
  idl: string
  adl: string
  vdl: string
  medicalLeave: string
  eligibleDelivered: string
  eligibleAttended: string
  eligiblePercentage: string
  detailsUrl?: string
  chk?: string
  obj?: string
}

interface MarkEvaluation {
  type: string
  marks: string
  grade: string // typically "max marks" or numerical grade
}

interface MarkRecord {
  subject: string
  evaluations: MarkEvaluation[]
}

import { getPortalData, savePortalData } from './persistence'

export interface AnnouncementRecord {
  title: string
  date: string
  description: string
  category: string
  link?: string
}

export interface AttendanceHistoryRecord {
  date: string
  type: string
  time: string
  status: string
  section?: string
  group?: string
  markedBy: string
}

export async function fetchCULKOData(
  endpoint: 'attendance' | 'marks' | 'timetable' | 'profile' | 'announcements' | 'hostel' | 'attendance-details', 
  customCookie?: string,
  extraParams?: { courseCode?: string; chk?: string }
) {
  try {
    const cookieStore = await cookies()
    const culkoCookies = customCookie || cookieStore.get('culko_session')?.value
    
    if (!culkoCookies) {
      console.warn(`[fetchCULKOData] No session for ${endpoint}. Trying DB fallback...`)
      const cached = await getPortalData(endpoint)
      if (cached.success) {
        return {
          success: true,
          data: cached.data,
          isCached: true,
          updatedAt: cached.updatedAt
        }
      }
      return {
        success: false,
        error: 'No active portal session. Please login to portal sync first.'
      }
    }
    
    // Parse cookies
    const sessionCookies = JSON.parse(culkoCookies)
    
    // Make request to CULKO
    let response: any
    if (endpoint === 'attendance-details' && extraParams?.courseCode) {
      response = await fetchAttendanceDetails(sessionCookies, extraParams.courseCode, extraParams.chk)
    } else {
      response = await fetchCULKOResource(endpoint, sessionCookies)
    }
    
    // MUST await - fire-and-forget is killed by serverless before it resolves
    try {
      if (endpoint !== 'announcements') {
        await savePortalData(endpoint as any, response)
      }
    } catch (syncErr) {
      console.error(`[fetchCULKOData] Sync error for ${endpoint}:`, syncErr)
    }
    
    return {
      success: true,
      data: response,
      isCached: false,
      updatedAt: new Date().toISOString()
    }
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error)
    
    // On error, try DB fallback
    const cached = await getPortalData(endpoint as any)
    if (cached.success) {
      return {
        success: true,
        data: cached.data,
        isCached: true,
        updatedAt: cached.updatedAt
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function fetchCULKOResource(endpoint: string, cookies: Record<string, string>) {
  const endpointMap: Record<string, string> = {
    attendance: '/frmStudentCourseWiseAttendanceSummary.aspx?type=etgkYfqBdH1fSfc255iYGw==',
    marks: '/frmStudentMarksView.aspx',
    timetable: '/frmMyTimeTable.aspx',
    profile: '/frmStudentProfile.aspx',
    announcements: '/StudentHome.aspx',
    result: '/result.aspx',
    hostel: '/frmStudenHostelDetails.aspx'
  }
  
  const url = BASE_URL + endpointMap[endpoint]
  
  const response = await fetch(url, {
    headers: {
      'Cookie': Object.entries(cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join('; '),
      'User-Agent': USER_AGENT,
      'Referer': `${BASE_URL}/StudentHome.aspx`
    }
  })
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  
  const html = await response.text()
  
  if (html.includes('id="txtUserId"') || html.includes('Login.aspx') || html.includes('Session Expired')) {
    console.error(`[fetchCULKOResource] Session for ${endpoint} has expired or is invalid.`)
    console.log('[fetchCULKOResource] HTML Length:', html.length)
    console.log('[fetchCULKOResource] Found Indicators:', {
      txtUserId: html.includes('id="txtUserId"'),
      Loginaspx: html.includes('Login.aspx'),
      SessionExpired: html.includes('Session Expired')
    })
    throw new Error('Unauthorized or Session Expired')
  }
  
  // Parse HTML based on endpoint - DIRECT HTML SCRAPING
  switch (endpoint) {
    case 'attendance':
      // ALWAYS try HTML parsing first — it has the full table with correct eligible metrics.
      const htmlData = parseAttendanceHTML(html)
      if (htmlData && htmlData.length > 0) {
        console.log(`[fetchCULKOResource] ✅ HTML parsed ${htmlData.length} attendance records — USING HTML PATH`)
        return htmlData
      }
      
      // Only fall back to AJAX if HTML parsing completely failed
      console.log('[fetchCULKOResource] ⚠️ HTML parsing returned 0 records — FALLING BACK TO AJAX')
      const ajaxData = await fetchAttendanceViaAjax(url, cookies)
      if (ajaxData && ajaxData.length > 0) {
        console.log(`[fetchCULKOResource] AJAX returned ${ajaxData.length} records`)
        return ajaxData
      }
      console.log('[fetchCULKOResource] ❌ Both HTML and AJAX returned 0 records')
      return htmlData
    case 'marks':
      return parseMarksHTML(html)
    case 'timetable':
      return parseTimetable(html)
    case 'profile':
      const profile = parseProfile(html)
      // Also fetch and add result data for CGPA (it's on result.aspx per user)
      try {
        const resUrl = BASE_URL + '/result.aspx'
        const resResponse = await fetch(resUrl, {
           headers: {
             'Cookie': Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; '),
             'User-Agent': 'Mozilla/5.0'
           }
        })
        if (resResponse.ok) {
          const resHtml = await resResponse.text()
          // Re-validate session for result page
          if (!resHtml.includes('id="txtUserId"') && !resHtml.includes('Login.aspx')) {
             const stats = parseResult(resHtml)
             profile.cgpa = stats.cgpa
             profile.sgpa = stats.sgpa
          }
        }
      } catch (e) {
        console.error('Result fetch failed:', e)
      }
      return profile
    case 'announcements':
      return fetchAnnouncementsViaAjax(url, cookies)
    case 'hostel':
      return parseHostelDetails(html)
    case 'attendance-details':
      return parseAttendanceHistory(html)
    default:
      throw new Error(`Unknown endpoint: ${endpoint}`)
  }
}

async function fetchAttendanceDetails(cookies: Record<string, string>, courseCode: string, chk?: string) {
  const cookieStr = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ')
  const baseHeaders: Record<string, string> = {
    'Cookie': cookieStr,
    'User-Agent': USER_AGENT,
    'Referer': `${BASE_URL}/frmStudentCourseWiseAttendanceSummary.aspx?type=etgkYfqBdH1fSfc255iYGw==`
  }

  // ── Step 1: Load summary page to extract reportId and sessionId ──
  const summaryUrl = `${BASE_URL}/frmStudentCourseWiseAttendanceSummary.aspx?type=etgkYfqBdH1fSfc255iYGw==`
  console.log(`[fetchDetails] Loading summary page for reportId and sessionId extraction...`)
  
  let html = ''
  try {
    const summaryRes = await fetch(summaryUrl, { headers: baseHeaders })
    html = await summaryRes.text()
  } catch (e) {
    console.error('[fetchDetails] Failed to load summary page:', e)
    return []
  }

  const $ = cheerio.load(html)

  // Extract chk and obj from the VIEW button if not provided
  let obj = courseCode
  if (!chk) {
    // 1. Try finding by courseCode as obj
    let btn = $(`input[obj="${courseCode}"], input[obj*="${courseCode}"]`).first()
    
    // 2. If not found (courseCode is actually the name), find the table row containing the name
    if (btn.length === 0) {
      $('tr').each((_, row) => {
        if ($(row).text().includes(courseCode)) {
          const rowBtn = $(row).find('input[chk], button[chk], [onclick*="getdata"]')
          if (rowBtn.length > 0) {
            btn = rowBtn.first()
            return false // break
          }
        }
      })
    }
    
    chk = btn.attr('chk') || ''
    obj = btn.attr('obj') || courseCode
  }
  console.log(`[fetchDetails] Resolved courseCode=${courseCode}, chk=${chk ? chk.substring(0, 15) + '...' : 'EMPTY'} obj=${obj}`)

  // Extract reportId and sessionId
  let reportId = ''
  let sessionId = ''
  
  const getReportMatch = html.match(/getReport\(['"]([^'"]+)['"]\s*,\s*['"]?(\d+)['"]?\)/)
  if (getReportMatch) {
    reportId = getReportMatch[1]
    sessionId = getReportMatch[2]
  }
  
  if (!sessionId) {
    const sessionMatch = html.match(/CurrentSession\s*\((\d+)\)/)
    if (sessionMatch) sessionId = sessionMatch[1]
  }
  
  if (!reportId) {
    const uidPatterns = [
      /getReport\(['"]([^'"]+)['"]/,
      /var\s+UID\s*=\s*['"]([^'"]+)['"]/,
      /var\s+reportId\s*=\s*['"]([^'"]+)['"]/,
    ]
    for (const pattern of uidPatterns) {
      const match = html.match(pattern)
      if (match) {
        reportId = match[1]
        break
      }
    }
  }

  console.log(`[fetchDetails] Extracted reportId=${reportId}, sessionId=${sessionId}`)

  // Extract ASP.NET form fields for fallback postback
  const viewState = $('#__VIEWSTATE').val() as string || ''
  const eventValidation = $('#__EVENTVALIDATION').val() as string || ''
  const viewStateGen = $('#__VIEWSTATEGENERATOR').val() as string || ''

  // ── Step 2: Try GetFullReport (Standard CULKO AJAX WebMethod) ──
  if (reportId && sessionId && chk) {
    try {
      const fullReportUrl = `${BASE_URL}/frmStudentCourseWiseAttendanceSummary.aspx/GetFullReport`
      console.log(`[fetchDetails] Sending request to GetFullReport: ${fullReportUrl}`)
      const res = await fetch(fullReportUrl, {
        method: 'POST',
        headers: {
          ...baseHeaders,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          course: chk,
          UID: reportId,
          fromDate: '0',
          toDate: '0',
          type: 'All',
          Session: sessionId
        })
      })
      
      if (res.ok) {
        const text = await res.text()
        console.log(`[fetchDetails] GetFullReport response status: ${res.status}, length: ${text.length}`)
        const parsed = JSON.parse(text)
        if (parsed.d) {
          const data = JSON.parse(parsed.d)
          if (Array.isArray(data) && data.length > 0) {
            console.log(`[fetchDetails] Successfully parsed ${data.length} detailed records from GetFullReport`)
            return data.map((r: any) => {
              const keys = Object.keys(r)
              const findK = (patterns: string[]) => {
                return keys.find(k => {
                  const lowerK = k.toLowerCase().replace(/[^a-z0-9]/g, '')
                  return patterns.some(p => lowerK.includes(p.replace(/[^a-z0-9]/g, '')))
                })
              }
              
              const dateVal = r[findK(['attdate', 'date'])] || ''
              const typeVal = r[findK(['attendancetype', 'subjecttype', 'type', 'classtype'])] || ''
              const timeVal = r[findK(['timing', 'classtime', 'time'])] || ''
              const statusVal = r[findK(['attendancecode', 'attendance', 'status', 'attstatus'])] || ''
              const sectionVal = r[findK(['section'])] || ''
              const groupVal = r[findK(['studentgroup', 'group'])] || ''
              const markedByVal = r[findK(['name', 'facultyname', 'markedby', 'faculty'])] || ''
              
              return {
                date: dateVal,
                type: typeVal,
                time: timeVal,
                status: statusVal,
                section: sectionVal,
                group: groupVal,
                markedBy: markedByVal
              }
            })
          }
        }
      } else {
        console.error(`[fetchDetails] GetFullReport endpoint returned status ${res.status}`)
      }
    } catch (e) {
      console.error(`[fetchDetails] GetFullReport execution error:`, e)
    }
  }

  // ── Step 3: Fallback Approaches if GetFullReport failed/not found ──
  console.log(`[fetchDetails] Falling back to standard endpoints...`)
  let ajaxUrl: string | null = null
  let ajaxMethod: string | null = null
  
  $('script').each((_, s) => {
    const sc = $(s).html() || ''
    if (!sc.includes('getdata')) return
    
    const urlMatch = sc.match(/url\s*:\s*['"]([^'"]+)['"]/i)
    if (urlMatch) ajaxUrl = urlMatch[1]
    
    if (sc.includes('JSON.stringify') || sc.includes("contentType.*json")) {
      ajaxMethod = 'json'
    } else if (sc.includes('data:') && sc.includes('chk')) {
      ajaxMethod = 'form'
    }
  })

  const endpoints = [
    ajaxUrl,
    'frmStudentCourseWiseAttendanceSummary.aspx/GetData',
    'frmStudentCourseWiseAttendanceSummary.aspx/GetAttendanceDetails', 
    'frmStudentCourseWiseAttendanceSummary.aspx/getdata',
    'frmStudentCourseWiseAttendanceSummary.aspx/GetReport',
  ].filter(Boolean) as string[]

  for (const ep of endpoints) {
    const fullUrl = ep.startsWith('http') ? ep : `${BASE_URL}/${ep.replace(/^\//, '')}`
    
    // Approach A: JSON WebMethod POST
    try {
      const res = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          ...baseHeaders,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ chk, obj })
      })
      
      if (res.ok) {
        const text = await res.text()
        console.log(`[fetchDetails] JSON POST fallback to ${ep}: ${text.length} chars`)
        
        try {
          const parsed = JSON.parse(text)
          if (typeof parsed.d === 'string' && parsed.d.includes('<')) {
            const history = parseAttendanceHistory(parsed.d)
            if (history.length > 0) return history
          }
          if (typeof parsed.d === 'string') {
            try {
              const data = JSON.parse(parsed.d)
              if (Array.isArray(data) && data.length > 0) {
                return data.map((r: any) => ({
                  date: r.Date || r.date || r.AttDate || '',
                  type: r.Type || r.ClassType || r.SubjectType || '',
                  time: r.Time || r.ClassTime || '',
                  status: r.Status || r.AttStatus || r.Attendance || '',
                  section: r.Section || '',
                  group: r.Group || '',
                  markedBy: r.MarkedBy || r.Faculty || r.FacultyName || ''
                }))
              }
            } catch {}
          }
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((r: any) => ({
              date: r.Date || r.date || '',
              type: r.Type || r.ClassType || '',
              time: r.Time || r.ClassTime || '',
              status: r.Status || r.AttStatus || r.Attendance || '',
              section: r.Section || '',
              group: r.Group || '',
              markedBy: r.MarkedBy || r.Faculty || ''
            }))
          }
        } catch {}
        
        if (text.includes('<table') || text.includes('<tr')) {
          const history = parseAttendanceHistory(text)
          if (history.length > 0) return history
        }
      }
    } catch (e) {
      console.log(`[fetchDetails] JSON POST failed for ${ep}`)
    }

    // Approach B: Form POST
    try {
      const formData = new URLSearchParams()
      formData.append('chk', chk || '')
      formData.append('obj', obj)
      if (viewState) formData.append('__VIEWSTATE', viewState)
      if (eventValidation) formData.append('__EVENTVALIDATION', eventValidation)
      if (viewStateGen) formData.append('__VIEWSTATEGENERATOR', viewStateGen)
      
      const res = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          ...baseHeaders,
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: formData
      })
      
      if (res.ok) {
        const text = await res.text()
        console.log(`[fetchDetails] Form POST fallback to ${ep}: ${text.length} chars`)
        if (text.includes('<table') || text.includes('<tr')) {
          const history = parseAttendanceHistory(text)
          if (history.length > 0) return history
        }
      }
    } catch (e) {
      console.log(`[fetchDetails] Form POST failed for ${ep}`)
    }
  }

  console.error('[fetchDetails] All detail fetching approaches failed. Returning empty history.')
  return []
}

function parseAttendanceHistory(html: string): AttendanceHistoryRecord[] {
  const $ = cheerio.load(html)
  const history: AttendanceHistoryRecord[] = []
  
  // Target the #fullreport table specifically (from portal inspect element)
  let targetTable = $('table#fullreport')
  
  // Fallback: find any table with attendance-like content
  if (targetTable.length === 0) {
    targetTable = $('table').filter((_, el) => {
      const txt = $(el).text().toLowerCase()
      return (txt.includes('present') || txt.includes('absent')) && 
             (txt.includes('date') || txt.includes('time'))
    }).first()
  }
  
  if (targetTable.length === 0) {
    // Last resort: scan ALL tables
    targetTable = $('table')
  }
  
  targetTable.find('tr').each((_, row) => {
    const cells = $(row).find('td')
    if (cells.length < 4) return
    
    // Strategy 1: Use data-label attributes (mobile responsive)
    const hasDataLabels = cells.filter((__, c) => $(c).attr('data-label')).length > 0
    
    if (hasDataLabels) {
      const getLabel = (needle: string) => {
        let val = ''
        cells.each((__, c) => {
          const label = ($(c).attr('data-label') || '').toLowerCase()
          if (label.includes(needle.toLowerCase())) {
            val = $(c).text().trim()
            return false
          }
        })
        return val
      }
      
      const date = getLabel('date')
      const status = getLabel('attendance') || getLabel('status')
      
      if (date && status) {
        history.push({
          date,
          type: getLabel('type') || 'Class',
          time: getLabel('time') || '--:--',
          status,
          section: getLabel('section') || '',
          group: getLabel('group') || '',
          markedBy: getLabel('marked by') || getLabel('marked') || 'System'
        })
      }
      return // next row
    }
    
    // Strategy 2: Positional parsing (desktop view)
    // Portal columns: SrNo(0), Date(1), Type(2), Time(3), Attendance(4), Section(5), Group(6), Marked By(7)
    // Check for date in cell 1 (skip SrNo)
    let dateIdx = -1
    for (let j = 0; j < Math.min(cells.length, 3); j++) {
      const txt = $(cells[j]).text().trim()
      // Match: DD/MM/YYYY or "Saturday, 25 Apr 2026" or "25 Apr 2026"
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(txt) || 
          /\d{1,2}\s+\w{3,9}\s+\d{4}/.test(txt) ||
          /^\w+day,?\s+\d{1,2}\s+\w+\s+\d{4}$/.test(txt)) {
        dateIdx = j
        break
      }
    }
    
    if (dateIdx >= 0) {
      const date = $(cells[dateIdx]).text().trim()
      const type = $(cells[dateIdx + 1])?.text().trim() || 'Class'
      const time = $(cells[dateIdx + 2])?.text().trim() || '--:--'
      const status = $(cells[dateIdx + 3])?.text().trim() || ''
      const section = $(cells[dateIdx + 4])?.text().trim() || ''
      const group = $(cells[dateIdx + 5])?.text().trim() || ''
      const markedBy = $(cells[dateIdx + 6])?.text().trim() || $(cells[cells.length - 1]).text().trim() || 'System'
      
      if (status && status.length > 2) {
        history.push({ date, type, time, status, section, group, markedBy })
      }
    }
  })
  
  console.log(`[parseAttendanceHistory] Parsed ${history.length} history records`)
  return history
}


async function fetchAnnouncementsViaAjax(url: string, cookies: Record<string, string>): Promise<AnnouncementRecord[]> {
  const ajaxUrl = url.split('?')[0] + '/GetAnnouncements'
  const ajaxData = JSON.stringify({ PageNumber: 1, Filter: '', Tab: 'ALL' })

  console.log('[fetchAnnouncementsViaAjax] Making request to:', ajaxUrl)
  console.log('[fetchAnnouncementsViaAjax] Cookies count:', Object.keys(cookies).length)

  try {
    const response = await fetch(ajaxUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; '),
        'User-Agent': 'Mozilla/5.0'
      },
      body: ajaxData
    })

    console.log('[fetchAnnouncementsViaAjax] Status:', response.status)

    if (!response.ok) {
      const errText = await response.text()
      console.error(`[fetchAnnouncementsViaAjax] Request failed: ${response.status}`, errText.slice(0, 200))
      return []
    }

    const json = await response.json()
    console.log('[fetchAnnouncementsViaAjax] JSON.d received:', !!json.d, 'Length:', json.d?.length || 0)

    if (!json.d) {
      console.warn('[fetchAnnouncementsViaAjax] No data property (d) in response. Check if authenticated.')
      return []
    }

    // CULKO GetAnnouncements usually returns a string with HTML rows
    const $ = cheerio.load(json.d)
    const announcements: AnnouncementRecord[] = []

    // Common pattern for CULKO announcements items
    $('.ann-list-item, .ann-item, .announcement-box, .row, .contentData, .contentData-announcements').each((_, el) => {
      const title = $(el).find('.ann-title, h4, b, .title, strong').first().text().trim()
      const date = $(el).find('.ann-date, span.date, .pull-right, .date, .time').first().text().trim()
      const description = $(el).find('.ann-desc, p, .text-muted, .desc').first().text().trim()
      const category = $(el).find('.badge, .label, .cat').first().text().trim() || 'General'
      const onclick = $(el).attr('onclick') || $(el).find('[onclick]').attr('onclick') || ''
      
      // Extract linked document if any
      let link = undefined
      // Try multiple link patterns
      const linkMatch = onclick.match(/openAnnouncement\(['"]([^'"]+)['"]\)/) || 
                        onclick.match(/ViewAnnouncement\(['"]([^'"]+)['"]\)/)
      
      if (linkMatch) {
         link = `https://student.culko.in/ViewAnnouncement.aspx?id=${linkMatch[1]}`
      }

      if (title && title.length > 2) {
        announcements.push({
          title,
          date,
          description,
          category,
          link
        })
      }
    })

    // Fallback for flat structure
    if (announcements.length === 0) {
      $('div').each((_, el) => {
         const text = $(el).text().trim()
         if (text.includes('-202') || text.includes('-203')) { // Date pattern
            const parts = text.split('\n').map(p => p.trim()).filter(p => p.length > 0)
            if (parts.length >= 2) {
               announcements.push({
                  title: parts[0],
                  date: parts[1],
                  description: parts.slice(2).join(' '),
                  category: 'General'
               })
            }
         }
      })
    }

    return announcements.slice(0, 5) // Keep it to 5 as per user request
  } catch (error) {
    console.error('[fetchAnnouncementsViaAjax] Error:', error)
    return []
  }
}

function parseResult(html: string): any {
  let stats = { cgpa: 'N/A', sgpa: 'N/A' }
  try {
    const $ = cheerio.load(html)
    const text = $('body').text()
    
    // Look for CGPA patterns in text
    const cgpaMatch = text.match(/CGPA\s*[:\-]?\s*([\d.]+)/i)
    if (cgpaMatch) stats.cgpa = cgpaMatch[1]
    
    const sgpaMatch = text.match(/Current\s*SGPA\s*[:\-]?\s*([\d.]+)/i) || text.match(/SGPA\s*[:\-]?\s*([\d.]+)/i)
    if (sgpaMatch) stats.sgpa = sgpaMatch[1]

    // If still N/A, check table/span specifically
    if (stats.cgpa === 'N/A') {
      $('td, span, label, th').each((_, el) => {
        const t = $(el).text().toLowerCase()
        if (t === 'cgpa' || t.includes('cumulative')) {
          const val = $(el).next().text().trim() || $(el).parent().next().text().trim()
          if (/^[\d.]+$/.test(val)) stats.cgpa = val
        }
      })
    }
  } catch {}
  return stats
}

async function fetchAttendanceViaAjax(url: string, cookies: Record<string, string>) {
  // Step 1: Get the page to extract report ID and session
  const pageResponse = await fetch(url, {
    headers: {
      'Cookie': Object.entries(cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join('; '),
      'User-Agent': USER_AGENT
    }
  })
  
  if (!pageResponse.ok) {
    throw new Error(`Failed to load attendance page: ${pageResponse.status}`)
  }
  
  const html = await pageResponse.text()
  
  // Try multiple patterns to extract report ID and session
  let reportId = null
  let sessionId = null
  
  // Pattern 1: getReport('...', '...') - with two parameters
  const getReportMatch = html.match(/getReport\(['"]([^'"]+)['"]\s*,\s*['"]?(\d+)['"]?\)/)
  if (getReportMatch) {
    reportId = getReportMatch[1]
    sessionId = getReportMatch[2]
    console.log('Found via getReport pattern:', { reportId, sessionId })
  }
  
  // Pattern 2: CurrentSession in dropdown/option
  if (!sessionId) {
    const sessionMatch = html.match(/CurrentSession\s*\((\d+)\)/)
    if (sessionMatch) {
      sessionId = sessionMatch[1]
      console.log('Found session via CurrentSession:', sessionId)
    }
  }
  
  // Fallback patterns for report ID
  if (!reportId) {
    const uidPatterns = [
      /getReport\(['"]([^'"]+)['"]/,  // Just get first param
      /var\s+UID\s*=\s*['"]([^'"]+)['"]/,
      /var\s+reportId\s*=\s*['"]([^'"]+)['"]/,
    ]
    
    for (const pattern of uidPatterns) {
      const match = html.match(pattern)
      if (match) {
        reportId = match[1]
        console.log('Found report ID via fallback pattern')
        break
      }
    }
  }
  
  if (!reportId || !sessionId) {
    console.error('Could not extract report ID or session from page')
    console.error('Report ID found:', reportId)
    console.error('Session ID found:', sessionId)
    
    return []
  }
  
  console.log(`Extracted Report ID: ${reportId}, Session: ${sessionId}`)
  
  // Step 2: Call the GetReport AJAX endpoint
  const ajaxUrl = url.split('?')[0] + '/GetReport'
  const ajaxData = `{UID:'${reportId}',Session:'${sessionId}'}`
  
  console.log('Making AJAX request to:', ajaxUrl)
  console.log('AJAX data:', ajaxData)
  
  const ajaxResponse = await fetch(ajaxUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': Object.entries(cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join('; '),
      'User-Agent': USER_AGENT
    },
    body: ajaxData
  })
  
  if (!ajaxResponse.ok) {
    throw new Error(`AJAX request failed: ${ajaxResponse.status}`)
  }
  
  const ajaxText = await ajaxResponse.text()
  console.log('AJAX response length:', ajaxText.length)
  
  try {
    // Parse the JSON response
    const parsed = JSON.parse(ajaxText)
    const attendanceJson = JSON.parse(parsed.d)
    
    console.log(`Parsed ${attendanceJson.length} attendance records from AJAX`)
    
    // DEBUG: Log all keys from first record to see actual field names
    if (attendanceJson.length > 0) {
      const sampleKeys = Object.keys(attendanceJson[0])
      console.log('[AJAX] First record keys:', sampleKeys.join(', '))
      console.log('[AJAX] First record values:', JSON.stringify(attendanceJson[0]))
    }
    
    // Convert to our format
    return attendanceJson.map((record: any) => {
      const keys = Object.keys(record)
      
      // Specific precise key finder to prevent pattern collision
      const getVal = (possibleKeys: string[]) => {
        for (const pk of possibleKeys) {
          const normPK = pk.toLowerCase().replace(/[^a-z0-9]/g, '')
          // First pass: try exact normalized key match
          const exactKey = keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === normPK)
          if (exactKey && record[exactKey] !== null && record[exactKey] !== undefined) {
            return String(record[exactKey]).trim()
          }
        }
        for (const pk of possibleKeys) {
          const normPK = pk.toLowerCase().replace(/[^a-z0-9]/g, '')
          // Second pass: try partial/includes match
          const partialKey = keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '').includes(normPK))
          if (partialKey && record[partialKey] !== null && record[partialKey] !== undefined) {
            return String(record[partialKey]).trim()
          }
        }
        return null
      }

      let code = getVal(['coursecode', 'code']) || ''
      let title = getVal(['title', 'coursename', 'subject', 'subjectname']) || 'Unknown'
      
      // Raw totals
      let total = getVal(['totaldelv', 'totaldelivered', 'delivered', 'totalclasses']) || '0'
      let attended = getVal(['totalattd', 'totalattended', 'attended', 'totalpresent']) || '0'
      let percentage = getVal(['totalpercentage', 'percentage']) || '0%'

      // Eligible metrics (must be precise to prevent total delivered fallback)
      let eligDelv = getVal(['eligibilitydelivered', 'eligibledelivered', 'eligibledelv', 'eligdelv', 'serveddelivered']) || total
      let eligAttd = getVal(['eligibilityattended', 'eligibleattended', 'eligibleattd', 'eligattd', 'servedattended']) || attended
      let eligPerc = getVal(['eligibilitypercentage', 'eligiblepercentage', 'eligibleperc', 'eligperc', 'servedpercentage']) || percentage

      // Leave Stats
      let idl = getVal(['idl', 'dutyleaveidl', 'dutyleaven']) || '0'
      let adl = getVal(['adl', 'dutyleaveadl']) || '0'
      let vdl = getVal(['vdl', 'dutyleaveother', 'dutyleavevdl']) || '0'
      let ml = getVal(['medicalleave', 'ml']) || '0'

      // EncryptCode for details (chk)
      let chk = getVal(['encryptcode', 'chk']) || ''

      // PATTERN DISCOVERY FOR CODE IF EMPTY
      if (!code || code === '') {
        const foundCode = keys.find(k => /^[A-Z0-9]+-[A-Z0-9]+$/.test(String(record[k])))
        if (foundCode) code = String(record[foundCode]).replace(/\s+/g, '')
      }

      return {
        name: title,
        code: code,
        chk: chk,
        obj: code,
        attended,
        total,
        percentage: eligPerc, // Prioritize the one used for criteria
        idl,
        adl,
        vdl,
        medicalLeave: ml,
        eligibleDelivered: eligDelv,
        eligibleAttended: eligAttd,
        eligiblePercentage: eligPerc
      }
    })
  } catch (error) {
    console.error('Error parsing AJAX response:', error)
    console.error('Raw response (first 500 chars):', ajaxText.substring(0, 500))
    
    // AJAX response reading failed, return empty
    return []
  }
}

function parseAttendanceHTML(html: string): AttendanceRecord[] {
  const records: AttendanceRecord[] = []
  
  try {
    const $ = cheerio.load(html)
    
    // Normalize helper: "Eligible_Delivered:" → "eligibledelivered"
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '')
    
    // ══════════════════════════════════════════════════════════════
    // STRATEGY: Find the attendance table, read its headers, build
    // a header→column index map, then extract each data row.
    // This works regardless of data-label, th vs td, underscores, etc.
    // ══════════════════════════════════════════════════════════════
    
    // Step 1: Find ALL tables that contain course-code patterns
    const candidateTables: any[] = []
    $('table').each((_, t) => {
      const tableText = $(t).text()
      // Must contain at least one course code like 25CSH-102
      if (/\d{2}[A-Z]{2,4}-\d{2,3}/.test(tableText)) {
        candidateTables.push($(t))
      }
    })
    
    console.log(`[parseAttendanceHTML] Found ${candidateTables.length} candidate tables with course codes`)
    
    for (const $table of candidateTables) {
      if (records.length > 0) break
      
      // Step 2: Find the header row — scan ALL rows for one that looks like a header
      let headerMap: Record<string, number> = {}
      let headerRowFound = false
      
      $table.find('tr').each((_, tr) => {
        if (headerRowFound) return
        
        // Collect all cells (th or td) in this row
        const cells = $(tr).find('th, td')
        if (cells.length < 8) return
        
        // Check if this row contains header-like text
        const rowText = $(tr).text().toLowerCase()
        const isHeaderRow = rowText.includes('eligible') && (rowText.includes('delivered') || rowText.includes('attended'))
        
        if (!isHeaderRow) return
        
        // Build the header map
        const headerTexts: string[] = []
        cells.each((i, c) => {
          const raw = $(c).text().trim()
          headerTexts.push(`${i}:"${raw}"`)
          const n = norm(raw)
          
          // Map normalized header text → column index
          if (n.includes('eligibledelivered')) headerMap['eligDelv'] = i
          else if (n.includes('eligibleattended')) headerMap['eligAttd'] = i
          else if (n.includes('eligiblepercentage')) headerMap['eligPerc'] = i
          else if (n.includes('totaldelv') || n.includes('totaldelivered')) headerMap['totalDelv'] = i
          else if (n.includes('totalattd') || n.includes('totalattended')) headerMap['totalAttd'] = i
          else if (n.includes('coursecode')) headerMap['code'] = i
          else if (n === 'title' || n.includes('subjectname') || n.includes('coursename')) headerMap['title'] = i
          else if (n.includes('medicalleave')) headerMap['ml'] = i
          else if (n === 'idl' || n.includes('dutyleaveidl') || n.includes('dutyleaven')) headerMap['idl'] = i
          else if (n === 'adl' || n.includes('dutyleaveadl')) headerMap['adl'] = i
          else if (n === 'vdl' || n.includes('dutyleaveother') || n.includes('dutyleavevdl')) headerMap['vdl'] = i
          else if (n.includes('viewattendance') || n.includes('view')) { /* skip */ }
        })
        
        headerRowFound = true
        console.log('[parseAttendanceHTML] HEADER ROW:', headerTexts.join(' | '))
        console.log('[parseAttendanceHTML] HEADER MAP:', JSON.stringify(headerMap))
      })
      
      // If no header row, use defaults
      if (!headerRowFound) {
        headerMap = { code: 0, title: 1, totalDelv: 2, totalAttd: 3, idl: 4, adl: 5, vdl: 6, ml: 7, eligDelv: 8, eligAttd: 9, eligPerc: 10 }
        console.log('[parseAttendanceHTML] No header row found, using default column map')
      }
      
      // Step 3: Parse data rows
      let firstRowLogged = false
      $table.find('tr').each((_, row) => {
        const cells = $(row).find('td')
        if (cells.length < 8) return
        
        // Try to find the course code — check headerMap['code'] first, then cell 0
        const codeIdx = headerMap['code'] ?? 0
        const code = cells.eq(codeIdx).text().trim()
        
        // Must look like a course code
        if (!/^\d{2}[A-Z]{2,4}-\d{2,3}$/.test(code) && !/^[A-Z0-9]{3,}-[A-Z0-9]+$/.test(code)) return
        
        // Debug: dump first data row
        if (!firstRowLogged) {
          const vals: string[] = []
          cells.each((ci, c) => vals.push(`${ci}:"${$(c).text().trim()}"`))
          console.log(`[parseAttendanceHTML] DATA ROW (${cells.length} cells): ${vals.join(' | ')}`)
          firstRowLogged = true
        }
        
        const get = (key: string, fallbackIdx: number) => {
          const idx = headerMap[key] ?? fallbackIdx
          return cells.eq(idx).text().trim() || '0'
        }
        
        const title = get('title', 1)
        if (!title || title.length < 3) return
        
        const totalDelv = get('totalDelv', 2)
        const totalAttd = get('totalAttd', 3)
        const eligDelv = get('eligDelv', 8)
        const eligAttd = get('eligAttd', 9)
        const eligPerc = get('eligPerc', 10)
        
        const viewBtn = $(row).find('input[chk], [onclick*="getdata"]')
        
        records.push({
          name: title,
          code,
          chk: viewBtn.attr('chk') || '',
          obj: viewBtn.attr('obj') || code,
          attended: totalAttd,
          total: totalDelv,
          percentage: eligPerc,
          idl: get('idl', 4),
          adl: get('adl', 5),
          vdl: get('vdl', 6),
          medicalLeave: get('ml', 7),
          eligibleDelivered: eligDelv,
          eligibleAttended: eligAttd,
          eligiblePercentage: eligPerc
        } as any)
      })
      
      if (records.length > 0) {
        console.log(`[parseAttendanceHTML] ✅ Parsed ${records.length} records from table. First: ${records[0].name} EligDelv=${(records[0] as any).eligibleDelivered} EligAttd=${(records[0] as any).eligibleAttended}`)
      }
    }
    
    // ══════════════════════════════════════════════════════════════
    // PASS 2: DATA-LABEL APPROACH (if no table headers found)
    // ══════════════════════════════════════════════════════════════
    if (records.length === 0) {
      console.log('[parseAttendanceHTML] Table approach failed, trying data-label Pass 2...')
      
      const eligDelvCells = $('td').filter((_, el) => {
        const label = norm($(el).attr('data-label') || '')
        return label.includes('eligibledelivered')
      })
      
      console.log(`[parseAttendanceHTML] Pass 2: Found ${eligDelvCells.length} data-label cells`)
      
      if (eligDelvCells.length > 0) {
        eligDelvCells.each((_, eligCell) => {
          const $row = $(eligCell).closest('tr')
          
          const getByLabel = (...needles: string[]): string => {
            let found = ''
            $row.find('td[data-label]').each((__, td) => {
              const labelNorm = norm($(td).attr('data-label') || '')
              for (const needle of needles) {
                if (labelNorm.includes(norm(needle))) {
                  found = $(td).text().trim()
                  return false
                }
              }
            })
            return found
          }
          
          const code = getByLabel('course code', 'coursecode', 'code')
          const title = getByLabel('title', 'subject name', 'course name')
          if (!title || title.length < 3) return
          
          const viewBtn = $row.find('input[chk], input[onclick*="getdata"], button[chk]')
          
          records.push({
            name: title,
            code: code || viewBtn.attr('obj') || '',
            chk: viewBtn.attr('chk') || '',
            obj: viewBtn.attr('obj') || code,
            attended: getByLabel('total attd', 'totalattd') || '0',
            total: getByLabel('total delv', 'totaldelv') || '0',
            percentage: getByLabel('eligible percentage', 'eligiblepercentage', 'percentage') || '0',
            idl: getByLabel('idl') || '0',
            adl: getByLabel('adl') || '0',
            vdl: getByLabel('vdl') || '0',
            medicalLeave: getByLabel('medical leave', 'medical') || '0',
            eligibleDelivered: $(eligCell).text().trim() || '0',
            eligibleAttended: getByLabel('eligible attended', 'eligibleattended') || '0',
            eligiblePercentage: getByLabel('eligible percentage', 'eligiblepercentage', 'percentage') || '0'
          } as any)
        })
      }
    }
  } catch (error) {
    console.error('[parseAttendanceHTML] Error:', error)
  }
  
  console.log(`[parseAttendanceHTML] Total: ${records.length} subjects parsed`)
  return records
}

function parseMarksHTML(html: string): MarkRecord[] {
  const records: MarkRecord[] = []
  
  try {
    const $ = cheerio.load(html)
    
    // PRIMARY STRATEGY: Accordion format (Subject is in h3, marks in nested table)
    // We check this first to prevent the inner tables from triggering the fallback!
    const accordion = $('#accordion, .panel-group')
    if (accordion.length > 0) {
      console.log('Cheerio found Marks Accordion!')
      
      accordion.find('h3, .panel-title').each((i, header) => {
        const subjectName = $(header).text().trim()
        
        let content = $(header).nextAll('.panel-collapse').first()
        if (content.length === 0) {
            content = $(header).next('div')
        }

        if (content.length > 0) {
          const evaluations: MarkEvaluation[] = []
          
          content.find('table tr').each((j, tr) => {
             if ($(tr).find('th').length > 0) return
             const cells = $(tr).find('td')
             if (cells.length >= 3) {
                const type = $(cells[0]).text().trim()
                const max = $(cells[1]).text().trim() // Sometimes marks are listed here
                const marks = $(cells[2]).text().trim() // Sometimes grades are here
                
                evaluations.push({
                  type: type,
                  marks: marks,
                  grade: max
                })
             }
          })
          
          if (evaluations.length > 0) {
            records.push({ subject: subjectName, evaluations })
          }
        }
      })
    } 
    
    if (records.length === 0) {
      console.log('Using robust table scraper for marks')
      // Advanced flat table parser - group by subject names
      $('table').each((_, table) => {
        let currentSubject = 'General Marks'
        let currentEvals: MarkEvaluation[] = []
        
        $(table).find('tr').each((_, tr) => {
          const ths = $(tr).find('th')
          const tds = $(tr).find('td')
          
          if (ths.length === 1 && tds.length === 0) {
             // Sometimes a single header row outlines the subject
             if (currentEvals.length > 0) {
                records.push({ subject: currentSubject, evaluations: currentEvals })
                currentEvals = []
             }
             currentSubject = ths.text().trim()
          } else if (tds.length >= 3) {
             const val1 = $(tds[0]).text().trim()
             const val2 = $(tds[1]).text().trim()
             const val3 = $(tds[2]).text().trim()
             
             // Check if it's a valid data row (contains numbers or valid grade words)
             if (/\d/.test(val2) || /\d/.test(val3) || val2.toLowerCase().includes('grade') || val3.toLowerCase().includes('grade')) {
               currentEvals.push({ type: val1, grade: val2, marks: val3 })
             }
          }
        })
        
        if (currentEvals.length > 0) {
          records.push({ subject: currentSubject, evaluations: currentEvals })
        }
      })
    }
    
    // Absolute fallback - parse flat text that user described: "MST -1 Theory \n 20 \n Grade: 16"
    if (records.length === 0) {
       console.log('Using raw text extraction for marks')
       const text = $('body').text()
       const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
       
       let currentSubject = 'Subject Marks'
       let evals: MarkEvaluation[] = []
       
       for (let i = 0; i < lines.length; i++) {
          const l = lines[i]
          // Looking for typical exam names
          if (l.match(/MST|Practical|MSP|Theory|Assign|Quiz/i) && i + 2 < lines.length) {
             const next1 = lines[i+1]
             const next2 = lines[i+2]
             
             // Pattern: MST -> 20 -> Grade: 16 OR MST -> 20 -> 16
             if (/^\d+(\.\d+)?$/.test(next1) && (next2.toLowerCase().includes('grade') || /^\d+(\.\d+)?$/.test(next2))) {
                evals.push({
                   type: l,
                   grade: next1,
                   marks: next2.replace(/grade:?/i, '').trim()
                })
                // Skip the parsed lines
                i += 2
             }
          }
       }
       if (evals.length > 0) records.push({ subject: currentSubject, evaluations: evals })
    }
    
  } catch (error) {
    console.error('Error parsing marks with cheerio:', error)
  }
  
  console.log(`Parsed ${records.length} mark subjects (records) with cheerio`)
  return records
}

function parseTimetable(html: string): any {
  const timetable: any = {}
  try {
    const $ = cheerio.load(html)
    // Find timetable
    let table = $('table[id*="timetable" i], table[id*="schedule" i], table[id*="grdMain" i]')
    if (table.length === 0) {
      $('table').each((_, el) => {
        const text = $(el).text().toLowerCase()
        if (text.includes('mon') && text.includes('tue')) {
          table = $(el)
          return false
        }
      })
    }
    
    if (table.length > 0) {
       const dayHeaders: string[] = []
       
       table.find('tr').each((i, row) => {
         const cells = $(row).find('th, td')
         if (cells.length > 1) {
            const firstCell = $(cells[0]).text().trim()
            
            // Is it the header row with Day names?
            if (i === 0 || firstCell.toLowerCase().includes('timing') || firstCell.toLowerCase().includes('time') || firstCell.toLowerCase() === 'day/time') {
               // Capture days from headers
               for(let j=1; j<cells.length; j++) {
                  let dayText = $(cells[j]).text().trim()
                  // Expand short day names
                  if (dayText.toLowerCase().startsWith('mon')) dayText = 'Monday'
                  else if (dayText.toLowerCase().startsWith('tue')) dayText = 'Tuesday'
                  else if (dayText.toLowerCase().startsWith('wed')) dayText = 'Wednesday'
                  else if (dayText.toLowerCase().startsWith('thu')) dayText = 'Thursday'
                  else if (dayText.toLowerCase().startsWith('fri')) dayText = 'Friday'
                  else if (dayText.toLowerCase().startsWith('sat')) dayText = 'Saturday'
                  else if (dayText.toLowerCase().startsWith('sun')) dayText = 'Sunday'
                  
                  dayHeaders.push(dayText)
                  timetable[dayText] = []
               }
            } 
            // Is it a timing row? (starts with a time string or number)
            else if (firstCell.includes(':') || /\d/.test(firstCell)) {
               const timing = firstCell
               
               // Match subjects across the row columns
               for(let j=1; j<cells.length; j++) {
                  const day = dayHeaders[j-1]
                  if (!day) continue
                  
                  const subjectName = $(cells[j]).text().trim()
                  // Ignore empty slots or breaks
                  if (subjectName && subjectName !== '&nbsp;' && subjectName !== '-' && !subjectName.toLowerCase().includes('break')) {
                    if (!timetable[day]) timetable[day] = []
                    timetable[day].push({ time: timing, subject: subjectName.replace(/\s+/g, ' ') })
                  }
               }
            }
         }
       })
    }
  } catch (e) {
    console.error('Error parsing timetable:', e)
  }
  return timetable
}

function formatContacts(raw: string): string {
  if (!raw || raw === 'Unknown') return raw
  // If it's a giant string of digits (stuck together)
  const digits = raw.replace(/\D/g, '')
  if (digits.length > 15) {
     // Likely 3 numbers (10 digits each, or similar)
     // Split every 10 digits if possible
     const matches = digits.match(/.{1,10}/g)
     return matches ? matches.join(' / ') : raw
  }
  return raw
}

function parseProfile(html: string): any {
  const profile: any = { 
    name: 'Student', uid: 'Unknown', semester: 'Unknown', email: 'Unknown',
    bloodGroup: 'Unknown', program: 'Unknown', dob: 'Unknown', 
    admissionYear: 'Unknown', address: 'Unknown', fathersName: 'Unknown', 
    mothersName: 'Unknown', cgpa: 'N/A', sgpa: 'N/A', mobile: 'Unknown',
    religion: 'Unknown', caste: 'Unknown'
  }
  try {
    const $ = cheerio.load(html)

    // ── EXACT ID MAP (from debug endpoint, CULKO Unnao portal) ──
    const exactIds: Record<string, keyof typeof profile> = {
      'lbstuUID':                               'uid',
      'ContentPlaceHolder1_lblName':            'name',
      'ContentPlaceHolder1_lblFathername':      'fathersName',
      'ContentPlaceHolder1_lblMothername':      'mothersName',
      'ContentPlaceHolder1_lblDob':             'dob',
      'ContentPlaceHolder1_lblAdmissionYear':   'admissionYear',
      'ContentPlaceHolder1_lblCurrentSemester': 'semester',
      'ContentPlaceHolder1_lblBloodGroup':      'bloodGroup',
      'ContentPlaceHolder1_lblProgramCode':     'program',
      'ContentPlaceHolder1_lblAddress':         'address',
      'ContentPlaceHolder1_lblReligion':        'religion',
      'ContentPlaceHolder1_lblCaste':           'caste',
    }

    Object.entries(exactIds).forEach(([id, field]) => {
      const val = $(`#${id}`).text().trim()
      if (val && val.length > 0) {
        profile[field] = field === 'name' ? val.replace(/^Hello,?\s*/i, '').trim() : val
      }
    })

    // ── CONTACTS GRID: Extract Student's own mobile & email ──
    // The grid has Contact Type rows: Father (0), Mother (1), Student (2)
    // We iterate all contact rows to find the "Student" one
    let studentMobile = 'Unknown'
    let studentEmail = 'Unknown'
    let fatherMobile = 'Unknown'
    let motherMobile = 'Unknown'

    let i = 0
    while (true) {
      const contactType = $(`#ContentPlaceHolder1_gvStudentContacts_lblContactType_${i}`).text().trim()
      if (!contactType) break
      const mobile = $(`#ContentPlaceHolder1_gvStudentContacts_lblMobile_${i}`).text().trim()
      const email = $(`#ContentPlaceHolder1_gvStudentContacts_lblemailid_${i}`).text().trim()

      if (contactType.toLowerCase() === 'student') {
        studentMobile = mobile || studentMobile
        studentEmail = email || studentEmail
      } else if (contactType.toLowerCase() === 'father') {
        fatherMobile = mobile || fatherMobile
      } else if (contactType.toLowerCase() === 'mother') {
        motherMobile = mobile || motherMobile
      }
      i++
    }

    if (studentMobile !== 'Unknown') profile.mobile = studentMobile
    if (studentEmail !== 'Unknown') profile.email = studentEmail

    // ── FALLBACKS for older portal versions ──
    // If still unknown try suffix-match selectors
    if (profile.uid === 'Unknown') {
      const val = $('[id$="lbstuUID"]').text().trim() || $('[id$="lblUID"]').text().trim() || $('[id$="lblEnrollNo"]').text().trim()
      if (val) profile.uid = val
    }
    if (profile.semester === 'Unknown') {
      const val = $('[id$="lblCurrentSemester"]').text().trim() || $('[id$="lblSemester"]').text().trim()
      if (val) profile.semester = val
    }
    if (profile.dob === 'Unknown') {
      const val = $('[id$="lblDob"]').text().trim() || $('[id$="lblDOB"]').text().trim() || $('[id$="lblDateOfBirth"]').text().trim()
      if (val) profile.dob = val
    }

    // ── EMAIL GUESS if still unknown ──
    const isEmailUnknown = !profile.email || profile.email === 'Unknown' || profile.email.length < 5
    if (isEmailUnknown && profile.uid !== 'Unknown') {
      profile.email = profile.uid.toLowerCase() + '@culkomail.in'
    }

    // ── UID REGEX FALLBACK ──
    if (profile.uid === 'Unknown') {
      const bodyText = $('body').text()
      const m = bodyText.match(/\b\d{2}[A-Za-z]+\d{4,5}\b/i)
      if (m) profile.uid = m[0].toUpperCase()
    }

    profile.mobile = formatContacts(profile.mobile)

  } catch (e) {
    console.error('Error parsing profile:', e)
  }
  return profile
}

export function parseHostelDetails(html: string) {
  const hostel = {
    status: '',
    seater: '',
    name: '',
    room: '',
    reportingStatus: ''
  }
  
  try {
    const $ = cheerio.load(html)
    
    $('td, span, div, th').each((_, el) => {
      const t = $(el).text().trim()
      const nextText = $(el).next().text().trim() || $(el).parent().next().text().trim()
      
      if (t === 'Hostel Status') hostel.status = nextText
      if (t === 'Seater') hostel.seater = nextText
      if (t === 'Hostel Name') hostel.name = nextText
      if (t === 'Room No') hostel.room = nextText
      if (t === 'Hostel Reporting Status') hostel.reportingStatus = nextText
    })

    if (!hostel.status || !hostel.room) {
       $('tr').each((_, row) => {
          const cells = $(row).find('td, th')
          if (cells.length >= 2) {
             const label = $(cells[0]).text().trim()
             const value = $(cells[1]).text().trim()

             if (label.includes('Hostel Status')) hostel.status = value
             if (label.includes('Seater')) hostel.seater = value
             if (label.includes('Hostel Name')) hostel.name = value
             if (label.includes('Room No')) hostel.room = value
             if (label.includes('Reporting Status')) hostel.reportingStatus = value
          }
       })
    }
  } catch (e) {
    console.error('Error parsing Hostel details', e)
  }
  
  return hostel
}


