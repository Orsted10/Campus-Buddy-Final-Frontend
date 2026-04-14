'use client'

import { useEffect } from 'react'
import { App } from '@capacitor/app'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function AppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // 1. Handle Deep Linking for Auth (Supabase PKCE)
    const handleUrlOpen = async (event: any) => {
      // url example: com.campusbuddy.app://callback?code=...
      const url = new URL(event.url)
      
      if (url.host === 'callback') {
        const code = url.searchParams.get('code')
        if (code) {
          try {
            const { error } = await supabase.auth.exchangeCodeForSession(code)
            if (error) throw error
            
            // Redirect to dashboard after successful session exchange
            router.push('/dashboard')
          } catch (err) {
            console.error('Deep link exchange failed:', err)
          }
        }
      }
    }

    // 2. Add listener
    App.addListener('appUrlOpen', handleUrlOpen)

    // 3. Clean up
    return () => {
      App.removeAllListeners()
    }
  }, [router, supabase])

  return <>{children}</>
}
