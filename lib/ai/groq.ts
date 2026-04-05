import Groq from 'groq-sdk'
import { SYSTEM_PROMPT } from './systemPrompt'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function chatWithGroq(messages: Array<{ role: string; content: string }>) {
  try {
    const formattedMessages = messages.slice(-10).map((msg) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }))

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...formattedMessages,
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
      stream: false,
    })

    return {
      success: true,
      content: completion.choices[0]?.message?.content || '',
    }
  } catch (error) {
    console.error('Groq API error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
