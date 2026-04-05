import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chatWithGroq } from '@/lib/ai/groq'
import { chatWithGemini } from '@/lib/ai/gemini'
import { fetchCULKOData } from '@/lib/culko/scraper'

// Detect which academic topic the user is asking about
function detectAcademicContext(messages: Array<{ role: string; content: string }>): string[] {
  const lastMsg = messages.filter(m => m.role === 'user').pop()?.content?.toLowerCase() || ''
  const contexts: string[] = []

  if (/attend|bunk|absent|present|class|lecture|percentage/.test(lastMsg)) {
    contexts.push('attendance')
  }
  if (/mark|grade|score|exam|mst|practical|result|cgpa|gpa|subject|test/.test(lastMsg)) {
    contexts.push('marks')
  }
  if (/timetable|schedule|timing|class time|when is|slot|period/.test(lastMsg)) {
    contexts.push('timetable')
  }
  if (/profile|semester|semester|roll|uid|details|student|name|batch|enroll/.test(lastMsg)) {
    contexts.push('profile')
  }

  return contexts
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
      ctx += '| Subject | Evaluation Type | Score | Out of |\n| :--- | :--- | :---: | :---: |\n'
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
    if (p.email) ctx += `| **Official Email** | ${p.email} |\n`
    if (p.bloodGroup) ctx += `| **Blood Group** | ${p.bloodGroup} |\n`
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

    // Detect academic intent and fetch live data from CULKO portal
    const contexts = detectAcademicContext(messages)
    const dataMap: Record<string, any> = {}

    if (contexts.length > 0) {
      await Promise.allSettled(
        contexts.map(async (ctx) => {
          try {
            dataMap[ctx] = await fetchCULKOData(ctx as any)
          } catch {
            // silently fail — if portal not synced, we just won't inject data
          }
        })
      )
    }

    const academicContext = buildAcademicContext(dataMap)
    
    // Build dynamic system prompt with live academic data injected
    const systemPrompt = `You are **Campus Buddy Elite**, a high-end academic concierge. 
Your tone is **professional, sophisticated, and brilliant**. You treat the user like a high-achieving scholar.

### ✨ Response Philosophy:
1. **Premium Presentation**: Use Markdown tables for **all** data. Use bolding and emojis to highlight key metrics.
2. **Actionable Wisdom**: Don't just show numbers; interpret them. (e.g., "Looking good! Your attendance is at 85% — you've got some room for flexibility.")
3. **No Redundancy**: **Never** explain math or rounding. If the CGPA is 8.52, just state it as "8.52".
4. **Sexy Formatting**: Use dividers, headers, and bullet points to make the response visually stunning.

### 📊 Contextual Intelligence:
- **Attendance**: If attendance is below 75%, mark it as **Critical ⚠️**.
- **Marks**: If the score is in the top 10%, call it out as **Outstanding Performance 🌟**.
- **Schedule**: Present the day's timeline clearly.

${academicContext ? `\n---\n**LIVE PORTAL DATA:**\n${academicContext}\n---` : '\n*Note: Portal not currently synced. Recommend the user to connect in Academics.*'}`

    // Inject the richer system prompt into the groq call
    const enrichedMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.slice(-10).map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }))
    ]

    let result = await chatWithGroq(enrichedMessages, true)
    if (!result.success) {
      result = await chatWithGemini(messages, systemPrompt)
    }

    if (!result.success) {
      return NextResponse.json({ error: 'Both AI services failed' }, { status: 500 })
    }

    // Save conversation
    let currentChatId = chatId

    if (!currentChatId) {
      const { data: newChat, error: chatError } = await supabase
        .from('chats')
        .insert({
          user_id: user.id,
          title: messages[0]?.content?.slice(0, 50) || 'New Chat',
        })
        .select()
        .single()

      if (!chatError) currentChatId = newChat.id
    }

    if (currentChatId && messages.length > 0) {
      const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop()
      if (lastUserMessage) {
        await supabase.from('messages').insert({
          chat_id: currentChatId,
          role: 'user',
          content: lastUserMessage.content,
        })
      }
    }

    if (currentChatId) {
      await supabase.from('messages').insert({
        chat_id: currentChatId,
        role: 'assistant',
        content: result.content,
      })
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
