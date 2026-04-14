import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chatWithGroq } from '@/lib/ai/groq'
import { chatWithGemini } from '@/lib/ai/gemini'

const CALENDAR_PROMPT = `Extract an academic calendar from the provided text and return ONLY a JSON array of objects with schema: [{ "date": "YYYY-MM-DD", "type": "teaching"|"holiday"|"exam"|"special", "event": "Description", "timetableOverride"?: "Monday"|"Tuesday"|... }]. Include as many dates as possible.`

const MENU_PROMPT = `Extract a hostel mess menu from the provided text and return ONLY a JSON object with schema: { "timings": { "breakfast": "...", "lunch": "...", "snacks": "...", "dinner": "..." }, "schedule": [ { "day": "Monday", "breakfast": "...", "lunch": "...", "snacks": "...", "dinner": "..." }, ... ] }. Use existing formatting style.`

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { rawText, type } = await req.json()
    const prompt = type === 'calendar' ? CALENDAR_PROMPT : MENU_PROMPT

    const messages = [
      { role: 'system' as const, content: 'You are a precise data extractor. Return JSON only.' },
      { role: 'user' as const, content: `${prompt}\n\nTEXT TO PARSE:\n${rawText}` }
    ]

    let result = await chatWithGroq(messages, false)
    if (!result.success) {
      result = await chatWithGemini(messages, '')
    }

    if (!result.success) throw new Error('AI failed')

    // Clean JSON from markdown if necessary
    let cleanJson = result.content.replace(/```json|```/g, '').trim()
    return NextResponse.json({ success: true, data: JSON.parse(cleanJson) })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
