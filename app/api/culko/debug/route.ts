import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import * as cheerio from 'cheerio'

// Debug endpoint: dumps all labeled elements from the profile page
// Visit /api/culko/debug to see what fields the portal actually has
export async function GET() {
  try {
    const cookieStore = await cookies()
    const culkoCookies = cookieStore.get('culko_session')
    
    if (!culkoCookies) {
      return NextResponse.json({ error: 'Not logged in to portal' }, { status: 401 })
    }

    const sessionCookies = JSON.parse(culkoCookies.value)
    const cookieHeader = Object.entries(sessionCookies).map(([k, v]) => `${k}=${v}`).join('; ')

    const response = await fetch('https://student.culko.in/frmStudentProfile.aspx', {
      headers: { 'Cookie': cookieHeader, 'User-Agent': 'Mozilla/5.0' }
    })

    if (!response.ok) {
      return NextResponse.json({ error: `HTTP ${response.status}` }, { status: 502 })
    }

    const html = await response.text()
    
    // Check if session expired
    if (html.includes('id="txtUserId"') || html.includes('Login.aspx')) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }
    
    const $ = cheerio.load(html)
    
    // Collect all span/label elements with their IDs and text
    const elements: { id: string; tag: string; text: string }[] = []
    $('span[id], label[id], input[id]').each((_, el) => {
      const id = $(el).attr('id') || ''
      const text = $(el).val()?.toString().trim() || $(el).text().trim()
      const tag = el.tagName
      if (id && text && text.length > 0 && text.length < 200) {
        elements.push({ id, tag, text })
      }
    })

    // Also collect all table rows as key-value pairs
    const tableData: { label: string; value: string }[] = []
    $('table tr').each((_, tr) => {
      const cells = $(tr).find('td, th')
      if (cells.length >= 2) {
        const label = $(cells[0]).text().trim()
        const value = $(cells[1]).text().trim()
        if (label && value && label.length < 100 && value.length < 200) {
          tableData.push({ label, value })
        }
      }
    })

    return NextResponse.json({
      elements: elements.slice(0, 100), // Cap at 100
      tableRows: tableData.slice(0, 50),
      rawTitleText: $('title').text()
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
