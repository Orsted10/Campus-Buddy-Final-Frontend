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
  attended: string
  total: string
  percentage?: string
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

export async function fetchCULKOData(endpoint: 'attendance' | 'marks' | 'timetable' | 'profile' | 'announcements' | 'hostel', customCookie?: string) {
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
    
    // SECURITY: Identity Binding Check
    // If we have a profile in the store, we should check if the cookie UID matches
    // But since this is server-side, we check against the database profile.
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('student_id').eq('id', user.id).maybeSingle()
      
      // If we can't verify the owner, we proceed but with caution. 
      // A more robust check would be to scrape the portal profile once and cache it.
      // For now, if the user explicitly has a student_id, we should eventually bind it.
    }
    
    // Make request to CULKO
    const response = await fetchCULKOResource(endpoint, sessionCookies)
    
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
      // CULKO often loads attendance via AJAX; try that first!
      const ajaxData = await fetchAttendanceViaAjax(url, cookies)
      if (ajaxData && ajaxData.length > 0) {
        return ajaxData
      }
      return parseAttendanceHTML(html)
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
    default:
      throw new Error(`Unknown endpoint: ${endpoint}`)
  }
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
      
      let title = getVal(['title', 'coursename', 'subject', 'name', 'course']) || 'Unknown'
      let attended = getVal(['totalattd', 'attended', 'totalattended', 'attd', 'present']) || '0'
      let total = getVal(['totaldelv', 'delivered', 'totaldelivered', 'delv', 'total']) || '0'
      let percentage = getVal(['totalpercentage', 'percentage', 'perc', 'percent']) || '0%'

      return {
        name: title,
        attended,
        total,
        percentage
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
    
    // Find attendance table
    let table = $('table#SortTable')
    
    if (table.length === 0) {
      // Find any table with 'attendance' related text
      $('table').each((_, el) => {
        const text = $(el).text().toLowerCase()
        if (text.includes('attendance') || text.includes('present') || text.includes('course')) {
          table = $(el)
          return false // break
        }
      })
    }
    
    if (table.length > 0) {
      console.log('Cheerio found attendance table!')
      
      // Map columns dynamically based on headers
      let titleIdx = 1, delvIdx = 2, attdIdx = 3, percIdx = 10
      const headers = table.find('th')
      
      headers.each((i, th) => {
        const text = $(th).text().toLowerCase().trim()
        if (text.includes('title') || text.includes('subject') || text.includes('course')) titleIdx = i
        if (text.includes('delv') || text.includes('delivered')) delvIdx = i
        if (text.includes('attd') || text.includes('attended')) attdIdx = i
        if (text.includes('percentage') || text === '%') percIdx = i
      })
      
      console.log(`Mapped Attendance Columns: Title=${titleIdx}, Delv=${delvIdx}, Attd=${attdIdx}, Perc=${percIdx}`)
      
      const rows = table.find('tr')
      
      rows.each((i, row) => {
        // Skip header
        if ($(row).find('th').length > 0) return 
        
        const cells = $(row).find('td')
        if (cells.length > Math.max(titleIdx, delvIdx, attdIdx) || cells.length >= 4) {
          
          let title = cells.length > titleIdx ? $(cells[titleIdx]).text().trim() : ''
          let delivered = cells.length > delvIdx ? $(cells[delvIdx]).text().trim() : ''
          let attended = cells.length > attdIdx ? $(cells[attdIdx]).text().trim() : ''
          let percentage = percIdx < cells.length ? $(cells[percIdx]).text().trim() : undefined
          
          // Fallback parsing if Title is still empty or indices failed spectacularly
          if (!title || (!attended && !delivered)) {
            const allText: string[] = []
            cells.each((_, c) => { allText.push($(c).text().trim()) })
            title = allText.find(t => t.length > 3 && /[a-zA-Z]/.test(t)) || 'Unknown'
            const nums = allText.filter(t => /^\d+$/.test(t) || /^[\d.]+$/.test(t)) // match ints or floats
            
            if (nums.length >= 2) {
               // usually the first numbers are attended/delivered
               attended = nums[0] || '0'
               delivered = nums[1] || '0'
               if (nums.length > 2) {
                 percentage = `${nums[2]}%`
               }
            }
          }
          
          if (title && title !== 'Unknown') {
            records.push({
              name: title,
              attended: attended || '0',
              total: delivered || '0',
              percentage: percentage
            })
          }
        }
      })
    } else {
      console.log('No attendance table found by cheerio')
    }
  } catch (error) {
    console.error('Error parsing attendance with cheerio:', error)
  }
  
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


