import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    const { uid, password } = await req.json()
    
    if (!uid || !password) {
      return NextResponse.json({ error: 'UID and password required' }, { status: 400 })
    }
    
    const sessionId = crypto.randomUUID()
    
    console.log(`[Session ${sessionId}] Starting interactive automated CULKO login for UID: ${uid}`)
    
    const scriptPath = path.join(process.cwd(), 'automated_culko_login.py')
    const sessionsDir = path.join(process.cwd(), '.sessions')
    
    if (!fs.existsSync(sessionsDir)) {
      fs.mkdirSync(sessionsDir, { recursive: true })
    }
    
    // Spawn Python process in detached mode so Next.js doesn't wait for stdio
    const pythonProcess = spawn('python', [
      scriptPath,
      '--uid', uid,
      '--password', password,
      '--interactive-api',
      '--session-id', sessionId
    ], {
      detached: true,
      stdio: 'ignore' // We communicate via files entirely to prevent hanging the API
    })
    
    // Unref the process so Next.js doesn't wait for it to exit
    pythonProcess.unref()
    
    // Poll for the status file
    const statusPath = path.join(sessionsDir, `${sessionId}_status.json`)
    const captchaPath = path.join(sessionsDir, `${sessionId}_captcha.png`)
    const resultPath = path.join(sessionsDir, `${sessionId}_result.json`)
    
    let waitTime = 0
    while (waitTime < 120) { // 120 seconds max to reach captcha
      if (fs.existsSync(statusPath) && fs.existsSync(captchaPath)) {
        // Read the image
        const imageBuffer = fs.readFileSync(captchaPath)
        const base64Image = imageBuffer.toString('base64')
        
        return NextResponse.json({
          success: true,
          requireCaptcha: true,
          sessionId: sessionId,
          captchaImage: `data:image/png;base64,${base64Image}`
        })
      }
      
      // If it failed before captcha (e.g., wrong UID, network error)
      if (fs.existsSync(resultPath)) {
        const resultRaw = fs.readFileSync(resultPath, 'utf8')
        try {
          const result = JSON.parse(resultRaw)
          // Clean up
          fs.unlinkSync(resultPath)
          return NextResponse.json({
             success: false,
             error: result.error || 'Login failed before CAPTCHA'
          }, { status: 400 })
        } catch (e) {
          // ignore
        }
      }
      
      await new Promise(r => setTimeout(r, 1000))
      waitTime++
    }
    
    return NextResponse.json({ error: 'Timeout waiting for portal' }, { status: 504 })
    
  } catch (error) {
    console.error('Error in login init:', error)
    return NextResponse.json({ error: 'Failed to initiate login' }, { status: 500 })
  }
}
