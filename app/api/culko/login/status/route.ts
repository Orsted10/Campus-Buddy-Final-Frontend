import { NextResponse } from 'next/server'

const SCRAPER = (process.env.SCRAPER_URL || 'http://localhost:8000').replace(/\/$/, '')

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })
    }

    // Quick check — Render just reads from its in-memory dict, responds in <100ms
    const response = await fetch(`${SCRAPER}/api/interactive/status/${sessionId}`, {
      signal: AbortSignal.timeout(8000),
    })

    if (response.status === 404) {
      return NextResponse.json({ status: 'error', error: 'Session expired or not found' }, { status: 404 })
    }

    if (!response.ok) {
      throw new Error(`Scraper returned ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error: any) {
    console.error('Error in login status proxy:', error)
    return NextResponse.json(
      { status: 'error', error: `Backend unavailable: ${error.message}` },
      { status: 500 }
    )
  }
}
