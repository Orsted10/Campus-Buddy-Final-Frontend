import { GoogleGenerativeAI } from '@google/generative-ai'
import { SYSTEM_PROMPT } from './systemPrompt'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '')

export async function chatWithGemini(messages: Array<{ role: string; content: string }>) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    // Convert messages to Gemini format
    const chatHistory = messages.slice(-10).map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }))

    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7,
      },
    })

    const result = await chat.sendMessage(SYSTEM_PROMPT)
    const response = await result.response
    const text = response.text()

    return {
      success: true,
      content: text,
    }
  } catch (error) {
    console.error('Gemini API error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
