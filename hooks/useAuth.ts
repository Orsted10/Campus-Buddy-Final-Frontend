'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/useAuthStore'
import type { Profile } from '@/types/database'

export function useAuth() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()
  const { user, setUser, clearUser } = useAuthStore()

  useEffect(() => {
    const getSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          // Try to get profile with error handling
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle()  // Use maybeSingle instead of single to avoid errors

            if (profileError) {
              console.warn('Profile fetch warning:', profileError.message)
              // If profile doesn't exist or can't be fetched, create a minimal user object
              const fallbackUser = {
                id: session.user.id,
                email: session.user.email || '',
                full_name: session.user.user_metadata?.full_name || 'User',
                role: session.user.user_metadata?.role || 'student',
                student_id: session.user.user_metadata?.student_id || null,
                phone: null,
                avatar_url: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
              console.log('Fallback user:', fallbackUser)
              setUser(fallbackUser as Profile)
              console.log('Zustand store updated with fallback user')
            } else if (profile) {
              setUser(profile as Profile)
            } else {
              // Profile doesn't exist, create from session
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                full_name: session.user.user_metadata?.full_name || 'User',
                role: session.user.user_metadata?.role || 'student',
                student_id: session.user.user_metadata?.student_id || null,
                phone: null,
                avatar_url: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              } as Profile)
            }
          } catch (err) {
            console.error('Error fetching profile:', err)
            // Fallback to session data
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              full_name: session.user.user_metadata?.full_name || 'User',
              role: session.user.user_metadata?.role || 'student',
              student_id: session.user.user_metadata?.student_id || null,
              phone: null,
              avatar_url: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            } as Profile)
          }
        } else {
          clearUser()
        }
      } catch (error) {
        // Ignore lock errors in development - they're harmless
        if (error instanceof Error && error.name === 'NavigatorLockAcquireTimeoutError') {
          console.log('Auth lock timeout (harmless in dev mode)')
          return
        }
        console.error('Error getting session:', error)
        clearUser()
      } finally {
        setLoading(false)
      }
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profile) {
          setUser(profile as Profile)
        }
      } else {
        clearUser()
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase, setUser, clearUser])

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      return { data, error: null }
    } catch (error: any) {
      return { data: null, error }
    }
  }

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: 'student' | 'admin' | 'hostel_staff' = 'student',
    studentId?: string
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
            student_id: studentId,
          },
        },
      })

      if (error) throw error
      return { data, error: null }
    } catch (error: any) {
      return { data: null, error }
    }
  }

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      })

      if (error) throw error
      return { data, error: null }
    } catch (error: any) {
      return { data: null, error }
    }
  }

  const signOut = async () => {
    try {
      console.log('--- SIGNOUT START ---')
      toast.loading('Logging out...', { id: 'logout' })
      
      // 1. Parallel session clearing for CULKO and Supabase
      // We don't await them yet, so we can clear local state immediately
      const culkoLogout = fetch('/api/culko/logout').catch(e => console.warn('Culko logout fail:', e))
      
      // Supabase logout with a 2-second timeout so it never hangs the UI
      const supabaseLogout = (async () => {
        try {
          return await Promise.race([
            supabase.auth.signOut(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase SignOut Timeout')), 2000))
          ])
        } catch (err) {
          console.warn('Supabase signOut error/timeout:', err)
          return { error: err }
        }
      })()

      // 2. Clear local store IMMEDIATELY (Zustand)
      // This is the "Clear it out" part - we don't wait for the server
      const { reset } = useAuthStore.getState()
      reset()
      console.log('Zustand store cleared')
      
      // 3. Force-clear ALL auth-related cookies manually
      const clearCookie = (name: string, path: string) => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path};`
      }

      const cookieNames = document.cookie.split(';').map(c => c.trim().split('=')[0])
      cookieNames.forEach(name => {
        if (name.includes('sb-') || name.includes('culko') || name.includes('supabase')) {
          clearCookie(name, '/')
          clearCookie(name, '/dashboard')
        }
      })
      console.log('Local cookies manually cleared')

      // 4. Await the network calls briefly but don't let them kill the process
      await Promise.allSettled([culkoLogout, supabaseLogout])
      console.log('Network logout calls settled')

      toast.success('Logged out successfully', { id: 'logout' })
      
      // 5. CRITICAL: Hard redirect to landing page (not /login)
      console.log('Redirecting to landing page...')
      window.location.href = '/'
      
      return { error: null }
    } catch (error: any) {
      console.error('Logout error:', error)
      // Total emergency reset
      useAuthStore.getState().reset()
      window.location.href = '/'
      return { error }
    }
  }

  const needsOnboarding = user !== null && !user.student_id

  return {
    user,
    loading,
    needsOnboarding,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  }
}
