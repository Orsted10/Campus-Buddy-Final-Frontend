import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const cookieStore = await cookies()
  const customSessionCookie = req.headers.get('x-culko-session')
  const culkoSession = customSessionCookie || cookieStore.get('culko_session')?.value

  if (!culkoSession) {
    return NextResponse.json({ success: false, connected: false })
  }

  try {
    const jar = JSON.parse(culkoSession)
    if (Object.keys(jar).length > 0) {
      return NextResponse.json({ success: true, connected: true })
    }
  } catch (e) {
    console.error('Invalid portal session cookie:', e)
  }

  return NextResponse.json({ success: false, connected: false })
}
