import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

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

// Helper to extract cookies from response
function extractCookies(response: Response): Record<string, string> {
  const setCookie = response.headers.get('set-cookie')
  if (!setCookie) return {}
  
  const jar: Record<string, string> = {}
  setCookie.split(',').forEach(c => {
    const pair = c.split(';')[0].trim().split('=')
    if (pair.length === 2) {
      jar[pair[0]] = pair[1]
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
      headers: { 'User-Agent': 'Mozilla/5.0' }
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
        'User-Agent': 'Mozilla/5.0'
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
        'User-Agent': 'Mozilla/5.0'
      }
    })
    jar = mergeCookies(jar, extractCookies(step2Res))
    const step2Html = await step2Res.text()
    const state2 = extractASPState(step2Html)

    // 4. GET CAPTCHA image
    const captchaRes = await fetch(`${BASE_URL}/GenerateCaptcha.aspx`, {
      headers: {
        'Cookie': serializeCookies(jar),
        'User-Agent': 'Mozilla/5.0'
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
        'User-Agent': 'Mozilla/5.0'
      },
      redirect: 'manual'
    })

    const finalJar = mergeCookies(jar, extractCookies(response))
    
    // Check if successful (usually it redirects to dashboard or says "Success")
    if (response.status === 302 || response.status === 200) {
      // Save to cookies
      const cookieStore = await cookies()
      cookieStore.set('culko_session', JSON.stringify(finalJar), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 // 24 hours
      })

      return { success: true }
    }

    return { success: false, error: 'Login failed - likely incorrect CAPTCHA or password' }
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

export async function fetchCULKOData(endpoint: 'attendance' | 'marks' | 'timetable' | 'profile') {
  try {
    const cookieStore = await cookies()
    const culkoCookies = cookieStore.get('culko_session')
    
    if (!culkoCookies) {
      return {
        success: false,
        error: 'Not authenticated with CULKO portal'
      }
    }
    
    // Parse cookies
    const sessionCookies = JSON.parse(culkoCookies.value)
    
    // Make request to CULKO
    const response = await fetchCULKOResource(endpoint, sessionCookies)
    
    return {
      success: true,
      data: response
    }
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error)
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
    result: '/result.aspx'
  }
  
  const url = BASE_URL + endpointMap[endpoint]
  
  const response = await fetch(url, {
    headers: {
      'Cookie': Object.entries(cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join('; '),
      'User-Agent': 'Mozilla/5.0'
    }
  })
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  
  const html = await response.text()
  
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
          const stats = parseResult(resHtml)
          profile.cgpa = stats.cgpa
          profile.sgpa = stats.sgpa
        }
      } catch (e) {
        console.error('Result fetch failed:', e)
      }
      return profile
    default:
      throw new Error(`Unknown endpoint: ${endpoint}`)
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
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
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
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
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

function parseProfile(html: string): any {
  const profile: any = { 
    name: 'Student', uid: 'Unknown', semester: 'Unknown', email: 'Unknown',
    bloodGroup: 'Unknown', program: 'Unknown', dob: 'Unknown', 
    admissionYear: 'Unknown', address: 'Unknown', fathersName: 'Unknown', 
    mothersName: 'Unknown', cgpa: 'N/A', sgpa: 'N/A', mobile: 'Unknown'
  }
  try {
    const $ = cheerio.load(html)
    
    // STRATEGY 1: ID Based Search (Common ASP.NET labels in these portals)
    const idMap: Record<string, keyof typeof profile> = {
      'lblStudentName': 'name',
      'lblFullName': 'name',
      'lblEnrollNo': 'uid',
      'lblUID': 'uid',
      'lblRegNo': 'uid',
      'lblSemester': 'semester',
      'lblSem': 'semester',
      'lblEmail': 'email',
      'lblEmailID': 'email',
      'lblProgName': 'program',
      'lblCourse': 'program',
      'lblMobile': 'mobile',
      'lblStudentMobile': 'mobile',
      'lblDOB': 'dob',
      'lblDateOfBirth': 'dob',
      'lblFatherName': 'fathersName',
      'lblMotherName': 'mothersName',
      'lblAddress': 'address',
      'lblPermanentAddress': 'address',
      'lblBloodGroup': 'bloodGroup'
    }

    Object.entries(idMap).forEach(([id, field]) => {
      const val = $(`#${id}`).text().trim() || $(`span[id*="${id}"]`).text().trim()
      if (val && val !== 'Unknown' && val !== 'Student' && val.length > 1) {
        profile[field] = val
      }
    })

    // STRATEGY 2: Find name in common headers/class names
    if (profile.name === 'Student') {
      const nameElem = $('div, span, h1, h2, h3').filter((_, el) => {
        const cls = $(el).attr('class') || ''
        const id = $(el).attr('id') || ''
        const txt = $(el).text()
        return (cls.toLowerCase().includes('name') || id.toLowerCase().includes('name')) && txt.includes(',')
      }).first()
      
      if (nameElem.length > 0) {
        profile.name = nameElem.text().replace(/^Hello,?/i, '').trim()
      }
    }
    
    // STRATEGY 3: Robust Table Search (matching labels text)
    $('table tr').each((_, tr) => {
       const cells = $(tr).find('td, th')
       for(let i=0; i < cells.length - 1; i++) {
          const txt = $(cells[i]).text().toLowerCase().replace(/[:.]/g, '').trim()
          let nextTxt = $(cells[i+1]).text().trim()
          
          if (!nextTxt || nextTxt.length < 2) continue
          
          // Clean up value (sometimes it has multiple labels)
          if (nextTxt.includes(':')) nextTxt = nextTxt.split(':')[1].trim()

          if (txt === 'uid' || txt.includes('enrollment') || txt === 'student id' || txt === 'roll no') profile.uid = nextTxt
          else if (txt === 'name' || txt === 'student name') { if (profile.name === 'Student') profile.name = nextTxt; }
          else if (txt === 'father\'s name' || txt === 'father name') profile.fathersName = nextTxt
          else if (txt === 'mother\'s name' || txt === 'mother name') profile.mothersName = nextTxt
          else if (txt === 'semester' || txt === 'current semester' || txt.includes('sem')) profile.semester = nextTxt
          else if (txt === 'blood group') profile.bloodGroup = nextTxt
          else if (txt === 'program code' || txt === 'program') profile.program = nextTxt
          else if (txt === 'dob' || txt === 'date of birth' || txt === 'd.o.b') profile.dob = nextTxt
          else if (txt === 'admission year') profile.admissionYear = nextTxt
          else if (txt === 'address' || txt === 'permanent address') profile.address = nextTxt
          else if (txt === 'email' || txt === 'email id') profile.email = nextTxt
          else if (txt === 'mobile' || txt === 'phone' || txt.includes('contact')) profile.mobile = nextTxt
       }
    })
    
    // Fallback regex for UID
    if (profile.uid === 'Unknown') {
      const textAll = $('body').text()
      const uidMatch = textAll.match(/\b\d{2}[A-Za-z]+\d{4,5}\b/i) // e.g. 25LBCS3067
      if (uidMatch) profile.uid = uidMatch[0].toUpperCase()
    }
    
  } catch (e) {
    console.error('Error parsing profile:', e)
  }
  return profile
}
