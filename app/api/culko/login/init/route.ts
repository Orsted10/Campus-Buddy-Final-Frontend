import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { uid, password } = await req.json()
    
    if (!uid || !password) {
      return NextResponse.json({ error: 'UID and password required' }, { status: 400 })
    }
    
    // Default to localhost if SCRAPER_URL is not set (for local dev)
    const scraperUrl = process.env.SCRAPER_URL || 'http://localhost:8000'
    const targetEndpoint = `${scraperUrl.replace(/\/$/, '')}/api/interactive/init`
    
    console.log(`[Proxy] Forwarding login init to Scraper API: ${targetEndpoint}`)
    
    // Proxy the request to the Python backend
    const response = await fetch(targetEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, password }),
      // Set a long timeout since scraping takes ~10-20 seconds
      signal: AbortSignal.timeout(120000) 
    })
    
    if (!response.ok) {
      throw new Error(`Scraper API returned ${response.status}: ${await response.text()}`)
    }
    
    const data = await response.json()
    return NextResponse.json(data)
    
  } catch (error: any) {
    console.error('Error in login init proxy:', error)
    return NextResponse.json({ error: `Failed to connect to Scraper Backend: ${error.message}` }, { status: 500 })
  }
}
