import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const cookieStore = await cookies()
  const culkoSession = cookieStore.get('culko_session')

  if (!culkoSession) {
    return NextResponse.json({ success: false, connected: false })
  }

  try {
    const jar = JSON.parse(culkoSession.value)
    if (Object.keys(jar).length > 0) {
      return NextResponse.json({ success: true, connected: true })
    }
  } catch (e) {
    console.error('Invalid portal session cookie:', e)
  }

  return NextResponse.json({ success: false, connected: false })
}
