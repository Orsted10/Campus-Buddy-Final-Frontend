import { GoogleGenerativeAI } from '@google/generative-ai'
import { SYSTEM_PROMPT } from './systemPrompt'

export async function chatWithGemini(messages: Array<{ role: string; content: string }>, customSystemPrompt?: string) {
  try {
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      throw new Error('GOOGLE_GEMINI_API_KEY is not set')
    }
    
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction: customSystemPrompt || SYSTEM_PROMPT
    })

    // Convert messages to Gemini format
    const history = messages.slice(-10).map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }))

    const result = await model.generateContent({
      contents: history,
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7,
      }
    })
    
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
      content: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
