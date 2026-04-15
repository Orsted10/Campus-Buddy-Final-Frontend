import { NextResponse } from 'next/server'
import { fetchCULKOData } from '@/lib/culko/scraper'
import { spawn } from 'child_process'
import path from 'path'

import { savePortalData, getPortalData, PortalDataType, saveAnnouncementsAsNotifications } from '@/lib/culko/persistence'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const endpoint = searchParams.get('endpoint') as PortalDataType
  
  if (!endpoint || !['attendance', 'marks', 'timetable', 'profile', 'announcements', 'hostel'].includes(endpoint)) {
    return NextResponse.json(
      { error: 'Invalid endpoint. Use: attendance, marks, timetable, profile, announcements, or hostel' },
      { status: 400 }
    )
  }
  
  // fetchCULKOData handles: live fetch → save to DB → fallback to DB
  // The isCached flag tells us which path was taken
  const customSessionCookie = req.headers.get('x-culko-session') || undefined
  
  if (customSessionCookie) {
    console.log(`[GET /api/culko] Received x-culko-session header for endpoint: ${endpoint}`)
  } else {
    console.log(`[GET /api/culko] No x-culko-session header provided for endpoint: ${endpoint}. Falling back to cookie jar.`)
  }

  const result = await fetchCULKOData(endpoint, customSessionCookie)
  
  if (result.success) {
    // If it's announcements, we also save them as notifications
    if (endpoint === 'announcements' && Array.isArray(result.data)) {
      await saveAnnouncementsAsNotifications(result.data)
    }
    return NextResponse.json(result)
  }
  
  return NextResponse.json(result, { status: 401 })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    // Check if this is a session monitoring request (hybrid approach)
    if (body.monitorSession) {
      return await handleSessionMonitoring(body.timeout || 300)
    }
    
    // Check if this is an automated login request
    if (body.uid && body.password) {
      return await handleAutomatedLogin(body.uid, body.password)
    }
    
    // Otherwise, handle manual cookie storage
    const { cookies } = body
    
    if (!cookies || typeof cookies !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request. Provide either cookies, uid/password, or monitorSession' },
        { status: 400 }
      )
    }
    
    console.log('Storing CULKO cookies:', Object.keys(cookies).length, 'cookies')
    
    // Store cookies in HTTP-only cookie
    const response = NextResponse.json({ success: true })
    response.cookies.set('culko_session', JSON.stringify(cookies), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    })
    
    return response
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

async function handleSessionMonitoring(timeout: number): Promise<NextResponse> {
  return new Promise((resolve) => {
    console.log('Starting CULKO session monitoring (timeout:', timeout, 'seconds)')
    
    // Path to the Python script
    const scriptPath = path.join(process.cwd(), 'culko_session_monitor.py')
    
    // Spawn Python process
    const pythonProcess = spawn('python', [
      scriptPath,
      '--timeout', timeout.toString(),
      '--json-output'
    ], {
      stdio: ['pipe', 'pipe', 'pipe']
    })
    
    let output = ''
    let errorOutput = ''
    
    pythonProcess.stdout.on('data', (data) => {
      const text = data.toString()
      output += text
      console.log('Python stdout:', text.trim())
    })
    
    pythonProcess.stderr.on('data', (data) => {
      const text = data.toString()
      errorOutput += text
      console.error('Python stderr:', text.trim())
    })
    
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Python process exited with code ${code}`)
        resolve(
          NextResponse.json(
            { 
              success: false, 
              error: `Session monitoring failed: ${errorOutput || 'Unknown error'}` 
            },
            { status: 500 }
          )
        )
        return
      }
      
      try {
        // Parse the JSON output - extract only the last line which should be JSON
        const lines = output.trim().split('\n')
        const jsonLine = lines[lines.length - 1]
        const result = JSON.parse(jsonLine)
        
        if (result.success && result.data) {
          console.log('Session monitoring and scraping successful!')
          
          // Store scraped data in session or return directly
          const response = NextResponse.json({ 
            success: true,
            message: 'Data scraped successfully',
            attendance: result.data.attendance || [],
            marks: result.data.marks || [],
            timetable: result.data.timetable || {},
            profile: result.data.profile || {}
          })
          
          resolve(response)
        } else {
          resolve(
            NextResponse.json(
              { 
                success: false, 
                error: result.error || 'Session monitoring failed' 
              },
              { status: 401 }
            )
          )
        }
      } catch (parseError) {
        console.error('Error parsing Python output:', parseError)
        console.error('Raw output:', output)
        console.error('Error output:', errorOutput)
        resolve(
          NextResponse.json(
            { 
              success: false, 
              error: `Failed to capture session. Check terminal for details.` 
            },
            { status: 500 }
          )
        )
      }
    })
    
    pythonProcess.on('error', (error) => {
      console.error('Failed to start Python process:', error)
      resolve(
        NextResponse.json(
          { 
            success: false, 
            error: 'Failed to start session monitor. Make sure Python and dependencies are installed.' 
          },
          { status: 500 }
        )
      )
    })
  })
}

async function handleAutomatedLogin(uid: string, password: string): Promise<NextResponse> {
  return new Promise((resolve) => {
    console.log('Starting automated CULKO login for UID:', uid)
    
    // Path to the Python script
    const scriptPath = path.join(process.cwd(), 'automated_culko_login.py')
    
    // Spawn Python process
    const pythonProcess = spawn('python', [
      scriptPath,
      '--uid', uid,
      '--password', password,
      '--json-output'
    ], {
      stdio: ['pipe', 'pipe', 'pipe']  // Ensure we capture all output
    })
    
    let output = ''
    let errorOutput = ''
    
    pythonProcess.stdout.on('data', (data) => {
      const text = data.toString()
      output += text
      console.log('Python stdout:', text.trim())
    })
    
    pythonProcess.stderr.on('data', (data) => {
      const text = data.toString()
      errorOutput += text
      console.error('Python stderr:', text.trim())
    })
    
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Python process exited with code ${code}`)
        resolve(
          NextResponse.json(
            { 
              success: false, 
              error: `Automation failed: ${errorOutput || 'Unknown error'}` 
            },
            { status: 500 }
          )
        )
        return
      }
      
      try {
        // Parse the JSON output - extract only the last line which should be JSON
        const lines = output.trim().split('\n')
        const jsonLine = lines[lines.length - 1] // Get last line
        const result = JSON.parse(jsonLine)
        
        if (result.success && result.cookies) {
          console.log('Automated login successful!')
          
          // Store cookies in HTTP-only cookie
          const response = NextResponse.json({ 
            success: true,
            message: 'Login successful via automation'
          })
          
          response.cookies.set('culko_session', JSON.stringify(result.cookies), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/'
          })
          
          resolve(response)
        } else {
          resolve(
            NextResponse.json(
              { 
                success: false, 
                error: result.error || 'Login failed' 
              },
              { status: 401 }
            )
          )
        }
      } catch (parseError) {
        console.error('Error parsing Python output:', parseError)
        console.error('Raw output:', output)
        console.error('Error output:', errorOutput)
        resolve(
          NextResponse.json(
            { 
              success: false, 
              error: `Automation failed. Check terminal for details. Error: ${errorOutput || output}` 
            },
            { status: 500 }
          )
        )
      }
    })
    
    pythonProcess.on('error', (error) => {
      console.error('Failed to start Python process:', error)
      resolve(
        NextResponse.json(
          { 
            success: false, 
            error: 'Failed to start automation service. Make sure Python and dependencies are installed.' 
          },
          { status: 500 }
        )
      )
    })
  })
}
