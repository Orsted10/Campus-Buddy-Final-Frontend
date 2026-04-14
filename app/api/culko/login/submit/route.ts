import { NextResponse } from 'next/server'
import { completeCULKOLogin } from '@/lib/culko/scraper'
import { after } from 'next/server'

export async function POST(req: Request) {
  try {
    const { sessionId, captchaText } = await req.json()
    if (!sessionId || !captchaText) {
      return NextResponse.json({ error: 'sessionId and captchaText required' }, { status: 400 })
    }

    const sessionObj = JSON.parse(sessionId)
    const password = sessionObj.password
    
    const result = await completeCULKOLogin(password, captchaText, sessionId)

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Login failed' }, { status: 401 })
    }

    // Kick off background capture AFTER response is sent (no blocking the client!)
    if (result.cookies) {
      const cookiesCopy = { ...result.cookies }
      after(async () => {
        try {
          const { captureBasePortalData } = await import('@/lib/culko/scraper')
          await captureBasePortalData(cookiesCopy)
          console.log('[submit] Background capture completed successfully.')
        } catch (e) {
          console.error('[submit] Background capture failed:', e)
        }
      })
    }

    // Respond immediately — client gets this in ~1-2 seconds!
    return NextResponse.json({ status: 'done', success: true })

  } catch (error: any) {
    console.error('Error in login submit:', error)
    return NextResponse.json(
      { error: `Internal scraper error: ${error.message}` },
      { status: 500 }
    )
  }
}
