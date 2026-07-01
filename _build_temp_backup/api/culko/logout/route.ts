import { NextResponse } from 'next/server'

export async function GET() {
  const response = NextResponse.json({ success: true })
  
  // Clear the culko_session cookie
  response.cookies.set('culko_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0), // Expire immediately
  })

  return response
}
