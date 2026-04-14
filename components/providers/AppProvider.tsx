'use client'

import { useEffect } from 'react'
import { App } from '@capacitor/app'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function AppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // 1. Initial State Check (Replaces Middleware for App)
    const checkInitialSession = async () => {
      const isApp = window.location.hostname === 'localhost' && !window.location.port || 
                    window.location.protocol === 'capacitor:'

      const { data: { session } } = await supabase.auth.getSession()
      const pathname = window.location.pathname

      if (isApp) {
        if (session && (pathname === '/' || pathname === '/login' || pathname === '/signup')) {
          router.replace('/dashboard')
        } else if (!session && pathname.startsWith('/dashboard')) {
          router.replace('/login')
        }
      }
    }

    checkInitialSession()

    // 2. Handle Deep Linking for Auth (Supabase PKCE)
    const handleUrlOpen = async (event: any) => {
      const url = new URL(event.url)
      
      if (url.host === 'callback') {
        const code = url.searchParams.get('code')
        if (code) {
          try {
            const { error } = await supabase.auth.exchangeCodeForSession(code)
            if (error) throw error
            router.push('/dashboard')
          } catch (err) {
            console.error('Deep link exchange failed:', err)
          }
        }
      }
    }

    App.addListener('appUrlOpen', handleUrlOpen)

    return () => {
      App.removeAllListeners()
    }
  }, [router, supabase])

  return <>{children}</>
}
