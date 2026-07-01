import { NextResponse } from 'next/server'
import { initCULKOLogin } from '@/lib/culko/scraper'

export async function POST(req: Request) {
  try {
    const { uid, password } = await req.json()
    if (!uid || !password) {
      return NextResponse.json({ error: 'UID and password required' }, { status: 400 })
    }

    // Call internal Node.js scraper (No browser, no Render needed!)
    const result = await initCULKOLogin(uid)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    // We store the password along with the session state in "sessionId" string
    // to pass it through to the next synchronous call without server-side state.
    const combinedSession = JSON.parse(result.sessionData!)
    combinedSession.password = password
    const sessionId = JSON.stringify(combinedSession)

    return NextResponse.json({
      status: 'captcha_ready',
      captchaImage: result.captchaImg,
      sessionId
    })

  } catch (error: any) {
    console.error('Error in login init:', error)
    return NextResponse.json(
      { error: `Internal scraper error: ${error.message}` },
      { status: 500 }
    )
  }
}
