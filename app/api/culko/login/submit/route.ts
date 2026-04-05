import { NextResponse } from 'next/server'
import { completeCULKOLogin } from '@/lib/culko/scraper'

export async function POST(req: Request) {
  try {
    const { sessionId, captchaText } = await req.json()
    if (!sessionId || !captchaText) {
      return NextResponse.json({ error: 'sessionId and captchaText required' }, { status: 400 })
    }

    // Extract password and state from the combined "sessionId" string
    const sessionObj = JSON.parse(sessionId)
    const password = sessionObj.password
    
    // Call internal Node.js scraper finalize
    const result = await completeCULKOLogin(password, captchaText, sessionId)

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Login failed' }, { status: 401 })
    }

    return NextResponse.json({ status: 'done', success: true })

  } catch (error: any) {
    console.error('Error in login submit:', error)
    return NextResponse.json(
      { error: `Internal scraper error: ${error.message}` },
      { status: 500 }
    )
  }
}
