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
      ctx += '\n\n## 📊 Student Attendance Data (Live from Portal):\n'
      ctx += rows.map((r: any) => {
        const pct = r.percentage ? `${r.percentage}%` : 'N/A'
        return `- ${r.name || r.subject}: ${r.attended || '?'}/${r.total || '?'} classes (${pct})`
      }).join('\n')
    }
  }

  if (dataMap.marks?.success && dataMap.marks.data) {
    const subjects = dataMap.marks.data as any[]
    if (subjects.length > 0) {
      ctx += '\n\n## 📝 Marks & Grades (Live from Portal):\n'
      subjects.forEach((subj: any) => {
        ctx += `\n**${subj.subject}:**\n`
        ;(subj.evaluations || []).forEach((ev: any) => {
          ctx += `  - ${ev.type}: ${ev.marks} / ${ev.grade}\n`
        })
      })
    }
  }

  if (dataMap.timetable?.success && dataMap.timetable.data) {
    const tt = dataMap.timetable.data as any[]
    if (tt.length > 0) {
      ctx += '\n\n## 🗓️ Timetable (Live from Portal):\n'
      tt.forEach((day: any) => {
        ctx += `\n**${day.day}:** `
        const slots = (day.slots || []).filter((s: any) => s.subject).map((s: any) => `${s.time}: ${s.subject}`).join(', ')
        ctx += slots || 'No classes'
      })
    }
  }

  if (dataMap.profile?.success && dataMap.profile.data) {
    const p = dataMap.profile.data
    ctx += '\n\n## 👤 Student Profile (Live from Portal):\n'
    if (p.name)     ctx += `- Name: ${p.name}\n`
    if (p.uid)      ctx += `- UID: ${p.uid}\n`
    if (p.semester) ctx += `- Semester: ${p.semester}\n`
    if (p.cgpa)     ctx += `- CGPA: ${p.cgpa}\n`
    if (p.branch)   ctx += `- Branch: ${p.branch}\n`
    if (p.batch)    ctx += `- Batch: ${p.batch}\n`
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
    const systemPrompt = `You are Campus Buddy, an AI assistant for college students at CULKO University.
You are knowledgeable, friendly, and precise. Always cite specific numbers from the data you are given.
Never say "go to the portal" or "please check the academic portal" — you HAVE the data right here.
If the student asks about attendance, marks, grades, timetable, or profile, answer directly from the live data provided below.
If the data is empty or missing, say "Your portal doesn't seem to be synced yet. Please connect it in the Academics Portal section."

Your areas of expertise:
1. Academic Performance — attendance, marks, grades, CGPA
2. Timetable — weekly schedule, class timings
3. Campus Life — hostel, mess, navigation, library, events
4. Administrative — document requests, fee payments
${academicContext ? `\n---\nLIVE ACADEMIC DATA (Use this to answer accurately):\n${academicContext}\n---` : ''}`

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
