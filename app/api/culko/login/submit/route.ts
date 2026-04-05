import { NextResponse } from 'next/server'

const SCRAPER = (process.env.SCRAPER_URL || 'http://localhost:8000').replace(/\/$/, '')

export async function POST(req: Request) {
  try {
    const { sessionId, captchaText } = await req.json()
    if (!sessionId || !captchaText) {
      return NextResponse.json({ error: 'sessionId and captchaText required' }, { status: 400 })
    }

    // Fires the submission in background on Render — returns immediately
    const response = await fetch(`${SCRAPER}/api/interactive/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, captchaText }),
      signal: AbortSignal.timeout(8000),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Scraper returned ${response.status}: ${text}`)
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error: any) {
    console.error('Error in login submit proxy:', error)
    return NextResponse.json(
      { error: `Backend unavailable: ${error.message}` },
      { status: 500 }
    )
  }
}
