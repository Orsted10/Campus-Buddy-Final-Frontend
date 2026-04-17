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
  markedBy: string
}

export async function fetchCULKOData(
  endpoint: 'attendance' | 'marks' | 'timetable' | 'profile' | 'announcements' | 'hostel' | 'attendance-details', 
  customCookie?: string,
  extraParams?: { courseCode?: string }
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
      // TRY HTML FIRST: Image 2 confirms HTML table has the right 74/75 metrics.
      // AJAX sometimes returns simplified data.
      const htmlData = parseAttendanceHTML(html)
      if (htmlData && htmlData.length > 0) {
        // Double check if HTML data actually has the eligible fields
        const hasEligible = htmlData.some(r => r.eligibleDelivered !== r.total)
        if (hasEligible) {
           console.log('[fetchCULKOResource] Using High-Accuracy HTML Attendance Data')
           return htmlData
        }
      }
      
      console.log('[fetchCULKOResource] HTML low accuracy, trying AJAX fallback...')
      const ajaxData = await fetchAttendanceViaAjax(url, cookies)
      if (ajaxData && ajaxData.length > 0) {
        return ajaxData
      }
      return htmlData // Return whatever we found in HTML if AJAX failed
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
  const reqHeaders: Record<string, string> = {
    'Cookie': cookieStr,
    'User-Agent': USER_AGENT,
    'Referer': `${BASE_URL}/frmStudentCourseWiseAttendanceSummary.aspx?type=etgkYfqBdH1fSfc255iYGw==`
  }

  // Load the summary page to:
  // 1. Get the chk for this course if not already provided
  // 2. Extract the actual AJAX URL used by getdata()
  const summaryUrl = `${BASE_URL}/frmStudentCourseWiseAttendanceSummary.aspx?type=etgkYfqBdH1fSfc255iYGw==`
  const summaryRes = await fetch(summaryUrl, { headers: reqHeaders })
  const summaryHtml = await summaryRes.text()
  const $ = cheerio.load(summaryHtml)

  // Get the chk for this specific course from the VIEW button
  if (!chk) {
    const viewBtn = $(`input[obj="${courseCode}"]`)
    chk = viewBtn.attr('chk') || ''
    console.log(`[fetchDetails] Extracted chk for ${courseCode}:`, chk ? chk.substring(0, 20) + '...' : 'NOT FOUND')
  }

  // Extract the AJAX URL from the getdata() JavaScript function in the page
  // The function body will contain something like: $.ajax({ url: '...', ...})
  let ajaxUrl: string | null = null
  const scripts = $('script').map((_, s) => $(s).html() || '').get()
  for (const script of scripts) {
    if (!script.includes('getdata')) continue
    
    // Look for URL patterns in AJAX calls
    const urlPatterns = [
      /url\s*:\s*['"]([^'"]*GetData[^'"]*)['"]/i,
      /url\s*:\s*['"]([^'"]*AttendanceDetail[^'"]*)['"]/i,
      /url\s*:\s*['"]([^'"]*Attendance[^'"]*)['"]/i,
      /\$\.ajax\s*\(\s*\{[^}]*url\s*:\s*['"]([^'"]+)['"]/i,
      /fetch\s*\(\s*['"]([^'"]+)['"]/i,
    ]
    
    for (const pattern of urlPatterns) {
      const match = script.match(pattern)
      if (match) {
        ajaxUrl = match[1]
        console.log('[fetchDetails] Found AJAX URL in JS:', ajaxUrl)
        break
      }
    }
    if (ajaxUrl) break
  }

  // If we found the AJAX URL, use it
  if (ajaxUrl && chk) {
    const fullUrl = ajaxUrl.startsWith('http') ? ajaxUrl : `${BASE_URL}/${ajaxUrl.replace(/^\//, '')}`
    console.log('[fetchDetails] Calling AJAX URL:', fullUrl, 'with chk for course:', courseCode)
    
    try {
      const res = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          ...reqHeaders,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ chk, obj: courseCode })
      })
      const text = await res.text()
      console.log('[fetchDetails] AJAX response length:', text.length, 'snippet:', text.substring(0, 200))
      
      try {
        const parsed = JSON.parse(text)
        const data = parsed.d ? JSON.parse(parsed.d) : parsed
        if (Array.isArray(data) && data.length > 0) {
          return data.map((r: any) => ({
            date: r.Date || r.date || r.AttDate || r.ClassDate || '',
            type: r.Type || r.ClassType || r.SubjectType || '',
            time: r.Time || r.ClassTime || '',
            status: r.Status || r.AttStatus || r.Attendance || '',
            markedBy: r.MarkedBy || r.Faculty || r.FacultyName || ''
          }))
        }
      } catch { /* not JSON, try HTML parsing */ }
      
      const history = parseAttendanceHistory(text)
      if (history.length > 0) return history
    } catch (e) {
      console.log('[fetchDetails] AJAX call failed:', e)
    }
  }

  // Fallback: Try known endpoint patterns with chk
  if (chk) {
    const knownEndpoints = [
      '/frmStudentCourseWiseAttendanceSummary.aspx/GetData',
      '/frmStudentCourseWiseAttendanceSummary.aspx/GetAttendanceDetails',
      '/frmStudentCourseWiseAttendanceSummary.aspx/GetReport',
    ]
    
    for (const endpoint of knownEndpoints) {
      try {
        const res = await fetch(`${BASE_URL}${endpoint}`, {
          method: 'POST',
          headers: {
            ...reqHeaders,
            'Content-Type': 'application/json; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: JSON.stringify({ chk, obj: courseCode })
        })
        if (res.ok) {
          const text = await res.text()
          console.log(`[fetchDetails] ${endpoint} response:`, text.substring(0, 300))
          
          try {
            const parsed = JSON.parse(text)
            const data = parsed.d ? JSON.parse(parsed.d) : parsed
            if (Array.isArray(data) && data.length > 0) {
              return data.map((r: any) => ({
                date: r.Date || r.date || r.AttDate || '',
                type: r.Type || r.ClassType || '',
                time: r.Time || r.ClassTime || '',
                status: r.Status || r.AttStatus || '',
                markedBy: r.MarkedBy || r.Faculty || ''
              }))
            }
          } catch { /* not JSON */ }
          
          const history = parseAttendanceHistory(text)
          if (history.length > 0) return history
        }
      } catch (e) {
        console.log('[fetchDetails] Endpoint failed:', endpoint)
      }
    }
  }

  console.error('[fetchDetails] All approaches failed for course:', courseCode)
  return []
}

function parseAttendanceHistory(html: string): AttendanceHistoryRecord[] {
  const $ = cheerio.load(html)
  const history: AttendanceHistoryRecord[] = []
  
  // SCAN ALL TABLES - The university portal sometimes wraps history in nested tables
  $('table').each((_, table) => {
    $(table).find('tr').each((i, row) => {
      const cells = $(row).find('td')
      if (cells.length >= 4) {
        // Search for a date pattern DD/MM/YYYY in the first few cells
        let date = ''
        let dateIdx = -1
        
        for (let j = 0; j < Math.min(cells.length, 3); j++) {
          const txt = $(cells[j]).text().trim()
          if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(txt)) {
            date = txt
            dateIdx = j
            break
          }
        }
        
        if (date) {
          // Once a date is found, mapping is usually consistent:
          // Date (Idx), Type (Idx+1), Time (Idx+2), Status (Idx+3)
          const type = $(cells[dateIdx + 1]).text().trim()
          const time = $(cells[dateIdx + 2]).text().trim()
          const status = $(cells[dateIdx + 3]).text().trim()
          
          // Only add if we have a valid status (Present/Absent/DL/ML/etc)
          if (status && status.length > 2) {
            history.push({
              date,
              type: type || 'Class',
              time: time || '--:--',
              status: status,
              markedBy: $(cells[dateIdx + 6]).text().trim() || $(cells[cells.length - 1]).text().trim() || 'System'
            })
          }
        }
      }
    })
    
    if (history.length > 0) return false // break out of table loop if records found
  })
  
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
    
    // Convert to our format
    return attendanceJson.map((record: any) => {
      const getVal = (possibleNames: string[]) => {
        for (const name of possibleNames) {
          const key = Object.keys(record).find(k => k.toLowerCase().replace(/[^a-z]/g, '') === name.toLowerCase().replace(/[^a-z]/g, ''))
          if (key && record[key] !== null && record[key] !== undefined && String(record[key]).trim() !== '') return String(record[key])
        }
        return null
      }
      
      // AGGRESSIVE KEY MAPPING
      const keys = Object.keys(record)
      const findKey = (patterns: string[]) => {
        return keys.find(k => {
          const lowerK = k.toLowerCase().replace(/[^a-z0-9]/g, '')
          return patterns.some(p => lowerK.includes(p.replace(/[^a-z0-9]/g, '')))
        })
      }

      let title = record[findKey(['coursename', 'title', 'subject'])] || 'Unknown'
      let attended = record[findKey(['totalattd', 'totalattended', 'attended'])] || '0'
      let total = record[findKey(['totaldelv', 'totaldelivered', 'delivered'])] || '0'
      let percentage = record[findKey(['totalpercentage', 'percentage'])] || '0%'
      let code = record[findKey(['coursecode', 'code'])] || ''

      // ELIGIBLE METRICS (Must find that 74 vs 75 difference)
      let eligDelv = record[findKey(['eligibledelivered', 'elimdelv', 'serveddelivered'])] || total
      let eligAttd = record[findKey(['eligibleattended', 'elimattd', 'servedattended'])] || attended
      let eligPerc = record[findKey(['eligiblepercentage', 'elimperc', 'eligiblepercentage'])] || percentage

      // Leave Stats
      let idl = record[findKey(['idl'])] || '0'
      let adl = record[findKey(['adl'])] || '0'
      let vdl = record[findKey(['vdl'])] || '0'
      let ml = record[findKey(['medicalleave', 'ml'])] || '0'

      // PATTERN DISCOVERY FOR CODE
      if (!code || code === '') {
        const foundCode = keys.find(k => /^[A-Z0-9]+-[A-Z0-9]+$/.test(String(record[k])))
        if (foundCode) code = String(record[foundCode]).replace(/\s+/g, '')
      }

      // NOTE: NO heuristic value discovery — incorrect records come from that.
      // Simply trust the explicit key mapping above.

      return {
        name: title,
        code: code,
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
    
    // DATA-LABEL FIRST APPROACH:
    // Instead of finding the table first (which is unreliable),
    // we find the "Eligible Delivered:" cells directly anywhere in the page
    // and walk UP to their parent <tr> to read everything else.
    
    // The inspect element confirmed: <td data-label="Eligible Delivered:">74</td>
    const eligDelvCells = $('td[data-label="Eligible Delivered:"], td[data-label="Eligible Delivered"]')
    
    console.log(`[parseAttendanceHTML] Found ${eligDelvCells.length} "Eligible Delivered" cells`)
    
    if (eligDelvCells.length > 0) {
      eligDelvCells.each((_, eligCell) => {
        const $row = $(eligCell).closest('tr')
        
        // Helper: get cell text by data-label from this specific row
        const getByLabel = (...labels: string[]): string => {
          for (const label of labels) {
            const val = $row.find(`td[data-label="${label}"]`).text().trim()
            if (val) return val
          }
          return ''
        }
        
        const code = getByLabel('Course Code:', 'Course Code', 'CourseCode')
        const title = getByLabel('Title:', 'Title', 'Subject Name', 'Subject')
        const totalDelv = getByLabel('Total_Delv:', 'Total Delv:', 'Total Delv')
        const totalAttd = getByLabel('Total_Attd:', 'Total Attd:', 'Total Attd')
        const idl = getByLabel('Duty Leave N P:', 'IDL:', 'IDL') || '0'
        const adl = getByLabel('Duty Leave ADL:', 'ADL:', 'ADL') || '0'
        const vdl = getByLabel('Duty Leave Others:', 'VDL:', 'VDL') || '0'
        const ml = getByLabel('Medical Leave:', 'Medical Leave') || '0'
        const eligDelv = $(eligCell).text().trim() // We already have this cell!
        const eligAttd = getByLabel('Eligible Attended:', 'Eligible Attended')
        const eligPerc = getByLabel('Eligible Percentage:', 'Eligible Percentage')
        
        // Extract chk from VIEW button in this row
        const viewBtn = $row.find('input[onclick="getdata(this)"], input[type="button"][obj]')
        const chk = viewBtn.attr('chk') || ''
        const btnObj = viewBtn.attr('obj') || ''
        
        if (title && title.length > 2) {
          const record: any = {
            name: title,
            code: code || btnObj,
            chk,
            attended: totalAttd,
            total: totalDelv,
            percentage: eligPerc,
            idl, adl, vdl,
            medicalLeave: ml,
            eligibleDelivered: eligDelv,
            eligibleAttended: eligAttd || totalAttd,
            eligiblePercentage: eligPerc
          }
          if (records.length < 3) console.log('[parseAttendanceHTML] Record:', JSON.stringify(record))
          records.push(record)
        }
      })
    }
    
    // FALLBACK: If data-label approach yielded 0, use column-index (Col 8 = EligDelv per portal structure)
    if (records.length === 0) {
      console.log('[parseAttendanceHTML] data-label yielded 0, trying column-index fallback...')
      $('table').each((_, tbl) => {
        const $tbl = $(tbl)
        if (!$tbl.text().toLowerCase().includes('eligible delivered')) return
        
        $tbl.find('tr').each((_, row) => {
          const $row = $(row)
          if ($row.find('th').length > 0) return // skip headers
          const cells = $row.find('td')
          if (cells.length >= 11) {
            const code = $(cells[0]).text().trim()
            const title = $(cells[1]).text().trim()
            if (!title || title.toLowerCase() === 'title' || title.length < 3) return
            
            const viewBtn = $row.find('input[onclick="getdata(this)"], input[type="button"][obj]')
            records.push({
              name: title, code,
              chk: viewBtn.attr('chk') || '',
              attended: $(cells[3]).text().trim(),
              total: $(cells[2]).text().trim(),
              percentage: $(cells[10]).text().trim(),
              idl: $(cells[4]).text().trim() || '0',
              adl: $(cells[5]).text().trim() || '0',
              vdl: $(cells[6]).text().trim() || '0',
              medicalLeave: $(cells[7]).text().trim() || '0',
              eligibleDelivered: $(cells[8]).text().trim(),
              eligibleAttended: $(cells[9]).text().trim(),
              eligiblePercentage: $(cells[10]).text().trim()
            } as any)
          }
        })
        if (records.length > 0) return false // break
      })
    }
    
  } catch (error) {
    console.error('[parseAttendanceHTML] Error:', error)
  }
  
  console.log(`[parseAttendanceHTML] Returning ${records.length} records`)
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


