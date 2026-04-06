import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chatWithGroq } from '@/lib/ai/groq'
import { chatWithGemini } from '@/lib/ai/gemini'
import { fetchCULKOData } from '@/lib/culko/scraper'
import { CAMPUS_POI } from '@/lib/constants'

// Detect which academic topic the user is asking about
function detectAcademicContext(messages: Array<{ role: string; content: string }>): string[] {
  const lastMsg = messages.filter(m => m.role === 'user').pop()?.content?.toLowerCase() || ''
  
  // If user asks broad questions, fetch everything
  if (/how|what|show|tell|all|summary|status|standing|academic|portal/.test(lastMsg)) {
    return ['attendance', 'marks', 'timetable', 'profile']
  }

  const contexts: string[] = []
  if (/attend|bunk|absent|present|class|lecture|percentage/.test(lastMsg)) contexts.push('attendance')
  if (/mark|grade|score|exam|mst|practical|result|cgpa|gpa|subject|test/.test(lastMsg)) contexts.push('marks')
  if (/timetable|schedule|timing|class time|when is|slot|period/.test(lastMsg)) contexts.push('timetable')
  if (/profile|semester|roll|uid|details|student|name|batch|enroll/.test(lastMsg)) contexts.push('profile')

  return contexts.length > 0 ? contexts : ['profile'] // Always at least profile for personalization
}

// Build campus POI context
function buildCampusContext(): string {
  let ctx = '\n\n### 📍 Campus Navigator (POI Knowledge)\n'
  ctx += 'You have detailed spatial knowledge of Block E and surrounding areas:\n'
  CAMPUS_POI.forEach(poi => {
    ctx += `- **${poi.name}**: Located in ${poi.block}, ${poi.floor} Floor (${poi.side}). ${poi.description}\n`
  })
  return ctx
}

// Build a rich context string from the academic data
function buildAcademicContext(dataMap: Record<string, any>): string {
  let ctx = ''

  if (dataMap.attendance?.success && dataMap.attendance.data) {
    const rows = dataMap.attendance.data as any[]
    if (rows.length > 0) {
      ctx += '\n\n### 📊 Live Attendance Report\n'
      ctx += '| Subject | Attended | Total | % |\n| :--- | :---: | :---: | :---: |\n'
      rows.forEach((r: any) => {
        const pct = r.percentage ? `${r.percentage}` : 'N/A'
        ctx += `| ${r.name || r.subject} | ${r.attended || '?'} | ${r.total || '?'} | **${pct}** |\n`
      })
    }
  }

  if (dataMap.marks?.success && dataMap.marks.data) {
    const subjects = dataMap.marks.data as any[]
    if (subjects.length > 0) {
      ctx += '\n\n### 📝 Academic Performance (Marks)\n'
      ctx += '| Subject | Evaluation Type | Score | Result/Max |\n| :--- | :--- | :---: | :---: |\n'
      subjects.forEach((subj: any) => {
        ;(subj.evaluations || []).forEach((ev: any) => {
          ctx += `| ${subj.subject} | ${ev.type} | **${ev.marks}** | ${ev.grade} |\n`
        })
      })
    }
  }

  if (dataMap.timetable?.success && dataMap.timetable.data) {
    const tt = dataMap.timetable.data as Record<string, any[]>
    const days = Object.keys(tt)
    if (days.length > 0) {
      ctx += '\n\n### 🗓️ Weekly Class Schedule\n'
      days.forEach((day) => {
        const slots = tt[day]
        if (slots && slots.length > 0) {
          ctx += `\n**${day}:**\n`
          ctx += '| Time | Subject |\n| :--- | :--- |\n'
          slots.forEach((s: any) => {
             ctx += `| ${s.time} | ${s.subject} |\n`
          })
        }
      })
    }
  }

  if (dataMap.profile?.success && dataMap.profile.data) {
    const p = dataMap.profile.data
    ctx += '\n\n### 👤 Student Profile & Academic Standing\n'
    ctx += `| Metric | Value |\n| :--- | :--- |\n`
    if (p.name) ctx += `| **Name** | ${p.name} |\n`
    if (p.uid)  ctx += `| **UID** | ${p.uid} |\n`
    if (p.cgpa && p.cgpa !== 'N/A') ctx += `| **Current CGPA** | ✨ **${p.cgpa}** |\n`
    if (p.sgpa && p.sgpa !== 'N/A') ctx += `| **Latest SGPA** | **${p.sgpa}** |\n`
    if (p.semester) ctx += `| **Semester** | ${p.semester} |\n`
    if (p.program) ctx += `| **Program** | ${p.program} |\n`
  }

  return ctx
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messages, chatId } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 })
    }

    // 1. Detect academic intent and fetch live data
    const contexts = detectAcademicContext(messages)
    const dataMap: Record<string, any> = {}

    if (contexts.length > 0) {
      await Promise.allSettled(
        contexts.map(async (ctx) => {
          try {
            dataMap[ctx] = await fetchCULKOData(ctx as any)
          } catch {
            // fallback handled in buildAcademicContext
          }
        })
      )
    }

    // 2. Build contexts
    const academicContext = buildAcademicContext(dataMap)
    const campusContext = buildCampusContext()
    
    // 3. Build Dynamic System Prompt
    const systemPrompt = `You are **Campus Buddy Elite**, a professional academic AI concierge. 
You possess full access to the student's academic standing and a complete spatial map of the campus.

### 🌟 Interaction Guidelines:
1. **Professional Grade Styling**: ALWAYS use Markdown tables for data. Use bolding, emojis, and dividers to create a stunning, readable response.
2. **Context-Aware Mastery**:
    - If asked about locations, use your **Campus Navigator** knowledge to give precise directions (e.g. "Library is on 4th floor, Block E").
    - If asked about academics, refer to the **Portal Data** provided below.
3. **The "Elite" Personality**: You are sophisticated, encouraging, and efficient. You don't just give data; you give insights (e.g., "Your 8.5 CGPA is outstanding — keep this momentum!").
4. **Visual Excellence**: Use headers (###) and dividers (---) to structure long responses. Use symbols for different categories (📊 Academics, 📍 Navigation, 🗓️ Schedule).

### 📍 CAMPUS KNOWLEDGE:
${campusContext}

### 📊 LIVE PORTAL DATA:
${academicContext || '*Portal not currently synced. Advise the user to connect their account in the Academics tab.*'}

---
**Current Focus**: Respond to the user's latest query using the data above. If data is missing for a specific subject, mention that the portal needs a fresh sync.`

    // 4. Call AI Model
    const enrichedMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.slice(-8).map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }))
    ]

    let result = await chatWithGroq(enrichedMessages, true)
    if (!result.success) {
      result = await chatWithGemini(messages, systemPrompt)
    }

    if (!result.success) {
      return NextResponse.json({ error: 'AI processing failed' }, { status: 500 })
    }

    // 5. Persistence
    let currentChatId = chatId
    if (!currentChatId) {
      const { data: newChat, error: chatError } = await supabase
        .from('chats')
        .insert({
          user_id: user.id,
          title: messages[0]?.content?.slice(0, 50) || 'New Chat',
        })
        .select().single()
      if (!chatError) currentChatId = newChat.id
    }

    if (currentChatId) {
      const lastMsg = messages[messages.length - 1]
      await supabase.from('messages').insert([
        { chat_id: currentChatId, role: 'user', content: lastMsg.content },
        { chat_id: currentChatId, role: 'assistant', content: result.content }
      ])
    }

    return NextResponse.json({
      success: true,
      content: result.content,
      chatId: currentChatId,
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
