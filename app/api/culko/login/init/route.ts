import { NextResponse } from 'next/server'

const SCRAPER = (process.env.SCRAPER_URL || 'http://localhost:8000').replace(/\/$/, '')

export async function POST(req: Request) {
  try {
    const { uid, password } = await req.json()
    if (!uid || !password) {
      return NextResponse.json({ error: 'UID and password required' }, { status: 400 })
    }

    // Fire the init request to Render — it returns IMMEDIATELY with a sessionId
    // because the browser automation runs in a background thread on the Render server.
    const response = await fetch(`${SCRAPER}/api/interactive/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, password }),
      signal: AbortSignal.timeout(10000), // Only needs 1-2s — just to start the job
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Scraper returned ${response.status}: ${text}`)
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error: any) {
    console.error('Error in login init proxy:', error)
    return NextResponse.json(
      { error: `Backend unavailable: ${error.message}` },
      { status: 500 }
    )
  }
}
