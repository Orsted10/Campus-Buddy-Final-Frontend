import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chatWithGroq } from '@/lib/ai/groq'
import { chatWithGemini } from '@/lib/ai/gemini'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messages, chatId } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      )
    }

    // Try Groq first, fallback to Gemini
    let result = await chatWithGroq(messages)

    if (!result.success) {
      console.log('Groq failed, trying Gemini...')
      result = await chatWithGemini(messages)
    }

    if (!result.success) {
      return NextResponse.json(
        { error: 'Both AI services failed' },
        { status: 500 }
      )
    }

    // Save conversation to database
    let currentChatId = chatId

    if (!currentChatId) {
      // Create new chat
      const { data: newChat, error: chatError } = await supabase
        .from('chats')
        .insert({
          user_id: user.id,
          title: messages[0]?.content?.slice(0, 50) || 'New Chat',
        })
        .select()
        .single()

      if (chatError) {
        console.error('Error creating chat:', chatError)
      } else {
        currentChatId = newChat.id
      }
    }

    // Save user message
    if (currentChatId && messages.length > 0) {
      const lastUserMessage = messages.filter((m) => m.role === 'user').pop()
      if (lastUserMessage) {
        await supabase.from('messages').insert({
          chat_id: currentChatId,
          role: 'user',
          content: lastUserMessage.content,
        })
      }
    }

    // Save assistant response
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
