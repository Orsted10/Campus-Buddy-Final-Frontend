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
      toast.loading('Logging out...', { id: 'logout' })
      
      // 1. Clear portal/culko session
      await fetch('/api/culko/logout').catch(() => {})
      
      // 2. Supabase signout - this clears the SB cookies
      const { error } = await supabase.auth.signOut()
      if (error) console.error('Supabase signOut error:', error)
      
      // 3. Clear all local zustand state
      const { reset } = useAuthStore.getState()
      reset()
      
      // 4. Manual cookie clearing (Extra safety for middleware)
      const cookies = document.cookie.split(';')
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i]
        const eqPos = cookie.indexOf('=')
        const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;'
      }

      toast.success('Logged out successfully', { id: 'logout' })
      
      // 5. Hard redirect to landing page (not /login)
      // This ensures we hit the server-side as unauthenticated.
      // Redirecting to / ensures the login page doesn't get stuck.
      window.location.href = '/'
      return { error: null }
    } catch (error: any) {
      console.error('Logout error:', error)
      useAuthStore.getState().reset()
      window.location.href = '/'
      return { error }
    }
  }

  return {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  }
}
