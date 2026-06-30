export async function chatWithOpenRouter(
  messages: Array<{ role: 'user' | 'assistant' | 'system', content: string }>,
  isJsonMode: boolean = false
) {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return { success: false, error: 'OpenRouter API Key missing' }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'nvidia/nemotron-4-340b-instruct:free',
        // Update model to nemotron 3 as requested by user
        model: 'nvidia/nemotron-3-nano-30b-a3b:free',
        messages,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) throw new Error('No content returned')

    return { success: true, content }
  } catch (error: any) {
    console.error('OpenRouter Error:', error)
    return { success: false, error: error.message }
  }
}
