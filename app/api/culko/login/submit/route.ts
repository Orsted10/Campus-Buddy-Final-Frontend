import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

export async function POST(req: Request) {
  try {
    const { sessionId, captchaText } = await req.json()
    
    if (!sessionId || !captchaText) {
      return NextResponse.json({ error: 'sessionId and captchaText required' }, { status: 400 })
    }
    
    console.log(`[Session ${sessionId}] Received CAPTCHA text, sending to Python backend...`)
    
    const sessionsDir = path.join(process.cwd(), '.sessions')
    const inputPath = path.join(sessionsDir, `${sessionId}_input.txt`)
    const resultPath = path.join(sessionsDir, `${sessionId}_result.json`)
    
    // Write input file for python to unblock
    fs.writeFileSync(inputPath, captchaText)
    
    // Poll for the result
    let waitTime = 0
    while (waitTime < 60) { // 60 seconds max to finish login
      if (fs.existsSync(resultPath)) {
        try {
          const resultRaw = fs.readFileSync(resultPath, 'utf8')
          const result = JSON.parse(resultRaw)
          
          // Clean up
          fs.unlinkSync(resultPath)
          
          if (result.success && result.cookies) {
             const response = NextResponse.json({ 
                success: true,
                message: 'Login successful via interactive automation'
              })
              
              response.cookies.set('culko_session', JSON.stringify(result.cookies), {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7, // 7 days
                path: '/'
              })
              
              return response
          } else {
             return NextResponse.json({
               success: false,
               error: result.error || 'Login failed invalid CAPTCHA or Password'
             }, { status: 401 })
          }
        } catch (e) {
          console.error('Failed to parse result:', e)
          return NextResponse.json({ error: 'Failed to parse result' }, { status: 500 })
        }
      }
      
      await new Promise(r => setTimeout(r, 1000))
      waitTime++
    }
    
    // Clean up input path just in case
    if (fs.existsSync(inputPath)) {
      fs.unlinkSync(inputPath)
    }
    
    return NextResponse.json({ error: 'Timeout waiting for login result' }, { status: 504 })
    
  } catch (error) {
    console.error('Error in login submit:', error)
    return NextResponse.json({ error: 'Failed to submit login' }, { status: 500 })
  }
}
