import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { sessionId, captchaText } = await req.json()
    
    if (!sessionId || !captchaText) {
      return NextResponse.json({ error: 'Session ID and CAPTCHA text required' }, { status: 400 })
    }
    
    const scraperUrl = process.env.SCRAPER_URL || 'http://localhost:8000'
    const targetEndpoint = `${scraperUrl.replace(/\/$/, '')}/api/interactive/submit`
    
    console.log(`[Proxy] Forwarding login submit to Scraper API: ${targetEndpoint}`)
    
    const response = await fetch(targetEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, captchaText }),
      // Set a long timeout since validation and subsequent cookie retrieval takes ~20-30s
      signal: AbortSignal.timeout(120000) 
    })
    
    if (!response.ok) {
      throw new Error(`Scraper API returned ${response.status}: ${await response.text()}`)
    }
    
    const data = await response.json()
    return NextResponse.json(data)
    
  } catch (error: any) {
    console.error('Error in login submit proxy:', error)
    return NextResponse.json({ error: `Failed to connect to Scraper Backend: ${error.message}` }, { status: 500 })
  }
}
