import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chatWithGroq } from '@/lib/ai/groq'
import { chatWithGemini } from '@/lib/ai/gemini'
import { fetchCULKOData } from '@/lib/culko/scraper'
import { CAMPUS_POI, MESS_MENU } from '@/lib/constants'

// Detect which academic or campus topic the user is asking about
function detectContext(messages: Array<{ role: string; content: string }>): string[] {
  const lastMsg = messages.filter(m => m.role === 'user').pop()?.content?.toLowerCase() || ''
  
  // If user asks broad questions, fetch everything academic
  if (/how|what|show|tell|all|summary|status|standing|academic|portal/.test(lastMsg)) {
    return ['attendance', 'marks', 'timetable', 'profile', 'mess']
  }

  const contexts: string[] = []
  if (/attend|bunk|absent|present|class|lecture|percentage/.test(lastMsg)) contexts.push('attendance')
  if (/mark|grade|score|exam|mst|practical|result|cgpa|gpa|subject|test/.test(lastMsg)) contexts.push('marks')
  if (/timetable|schedule|timing|class time|when is|slot|period/.test(lastMsg)) contexts.push('timetable')
  if (/profile|semester|roll|uid|details|student|name|batch|enroll/.test(lastMsg)) contexts.push('profile')
  if (/food|mess|eat|breakfast|lunch|dinner|snack|menu|canteen|cafeteria/.test(lastMsg)) contexts.push('mess')

  return contexts.length > 0 ? contexts : ['profile'] // Always profile for personalization
}

// Build mess context
function buildMessContext(): string {
  let ctx = '\n\n### 🍱 Hostel Mess Menu (Timings & Daily Specials)\n'
  ctx += `- **Breakfast**: ${MESS_MENU.timings.breakfast}\n`
  ctx += `- **Lunch**: ${MESS_MENU.timings.lunch}\n`
  ctx += `- **Snacks**: ${MESS_MENU.timings.snacks}\n`
  ctx += `- **Dinner**: ${MESS_MENU.timings.dinner}\n\n`
  
  ctx += '| Day | Breakfast | Lunch | Snacks | Dinner |\n| :--- | :--- | :--- | :--- | :--- |\n'
  MESS_MENU.schedule.forEach(s => {
    ctx += `| ${s.day} | ${s.breakfast} | ${s.lunch} | ${s.snacks} | ${s.dinner} |\n`
  })
  return ctx
}

// Build campus POI context
function buildCampusContext(): string {
  let ctx = '\n\n### 📍 Campus Navigator (POI Knowledge)\n'
  ctx += 'You have spatial knowledge of Block E and surrounding hostel areas:\n'
  
  ctx += '\n**Block E Floor Mappings (Crucial Rule):**\n'
  ctx += '- Rooms 200-220: **1st Floor, LHS** (Left Hand Side)\n'
  ctx += '- Rooms 221-240: **1st Floor, RHS** (Right Hand Side)\n'
  ctx += '- Rooms 300-320: **2nd Floor, LHS**\n'
  ctx += '- Rooms 321-340: **2nd Floor, RHS**\n'
  ctx += '- Rooms 400-420: **3rd Floor, LHS**\n'
  ctx += '- Rooms 421-440: **3rd Floor, RHS**\n'
  ctx += '- Rooms 500-520: **4th Floor, LHS**\n'
  ctx += '- Rooms 521-540: **4th Floor, RHS**\n'
  ctx += '- Rooms 600-620: **5th Floor, LHS**\n'
  ctx += '- Rooms 621-640: **5th Floor, RHS**\n'
  ctx += '*(Always use these ranges when asked to locate any specific room number)*\n\n'

  CAMPUS_POI.forEach(poi => {
    ctx += `- **${poi.name}**: ${poi.block}, ${poi.floor} Floor. ${poi.description}\n`
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

    // 1. Detect academic/campus intent and fetch live data
    const contexts = detectContext(messages)
    const dataMap: Record<string, any> = {}

    if (contexts.length > 0) {
      await Promise.allSettled(
        contexts.map(async (ctx: string) => {
          if (ctx === 'mess') return // Mess is static constant for now
          try {
            dataMap[ctx] = await fetchCULKOData(ctx as any)
          } catch {
            // fallback handled in context builders
          }
        })
      )
    }

    // 2. Build contexts
    const academicContext = buildAcademicContext(dataMap)
    const campusContext = buildCampusContext()
    const messContext = buildMessContext()
    
    // 3. Build Dynamic System Prompt
    const systemPrompt = `You are **Campus Buddy Elite**, a professional academic AI concierge. 
You possess full access to the student's academic standing, the hostel mess menu, and a complete spatial map of the campus.

### 🌟 Interaction Guidelines:
1. **Professional Grade Styling**: ALWAYS use Markdown tables for data. Use highly readable formatting: bold key words, bullet lists for multiple items, and emojis for a friendly touch.
2. **Context-Aware Mastery**:
    - If asked about locations, ALWAYS reference the **Block E Floor Mappings** perfectly. (e.g. Room 412 is 3rd Floor LHS).
    - If asked about academics, refer to the **Portal Data**.
    - If asked about food/mess, refer to the **Hostel Mess Menu**.
3. **The "Elite" Personality**: You are highly intelligent, sophisticated, encouraging, and efficient.
4. **Visual Excellence**: Separate major sections with horizontal rules (---). Keep paragraphs concise and easy to read. Be much smarter and structured in your explanations. Use blockquotes (>) for tips.

### 🍱 HOSTEL MESS MENU:
${messContext}

### 📍 CAMPUS KNOWLEDGE:
${campusContext}

### 📊 LIVE ACADEMIC PORTAL DATA:
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
      
      if (chatError) {
        console.error('CHAT INSERTION ERROR (RLS/Auth Check):', chatError)
      } else if (newChat) {
        currentChatId = newChat.id
      }
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
