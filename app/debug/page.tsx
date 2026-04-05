'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/useAuthStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>({})
  const user = useAuthStore((state) => state.user)
  const supabase = createClient()

  const checkAuth = async () => {
    const info: any = {
      timestamp: new Date().toISOString(),
      zustandUser: user ? {
        email: user.email,
        role: user.role,
        name: user.full_name
      } : null,
    }

    try {
      // Check Supabase session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      info.supabaseSession = session ? {
        exists: true,
        user: session.user.email,
        expires: new Date(session.expires_at! * 1000).toISOString()
      } : null
      info.sessionError = sessionError?.message

      // Check Supabase user
      const { data: { user: supaUser }, error: userError } = await supabase.auth.getUser()
      info.supabaseUser = supaUser ? {
        id: supaUser.id,
        email: supaUser.email,
        emailConfirmed: supaUser.email_confirmed_at ? 'Yes' : 'No'
      } : null
      info.userError = userError?.message

      // Check if profile exists
      if (supaUser) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', supaUser.id)
          .single()
        
        info.profile = profile ? {
          exists: true,
          name: profile.full_name,
          role: profile.role
        } : null
        info.profileError = profileError?.message
      }

      // List all users in auth
      const { data: allUsers } = await supabase.from('profiles').select('email, full_name, role').limit(5)
      info.existingProfiles = allUsers || []

    } catch (error: any) {
      info.error = error.message
    }

    setDebugInfo(info)
  }

  useEffect(() => {
    checkAuth()
  }, [])

  return (
    <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">🔍 Authentication Debugger</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={checkAuth} className="w-full">
              Refresh Debug Info
            </Button>

            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <h3 className="font-semibold mb-2">Current Status:</h3>
              <ul className="space-y-1 text-sm">
                <li>• Zustand Store User: {user ? '✅ Logged In' : '❌ Not Logged In'}</li>
                <li>• Supabase Session: {debugInfo.supabaseSession ? '✅ Active' : '❌ None'}</li>
                <li>• Profile Exists: {debugInfo.profile ? '✅ Yes' : '❌ No'}</li>
              </ul>
            </div>

            <div className="p-4 bg-card border rounded-lg">
              <h3 className="font-semibold mb-2">Debug Information:</h3>
              <pre className="text-xs overflow-auto whitespace-pre-wrap max-h-96">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" onClick={() => window.location.href = '/signup'}>
                Go to Sign Up
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/login'}>
                Go to Login
              </Button>
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg text-sm">
              <h3 className="font-semibold mb-2">💡 What to do:</h3>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>If "Zustand Store User" is null → You need to log in</li>
                <li>If "Supabase Session" is null → Login didn't work, try again</li>
                <li>If "Profile Exists" is null → Run fix_profile_trigger.sql in Supabase</li>
                <li>Check "existingProfiles" to see if any users exist</li>
                <li>After signing up, refresh this page to see updated info</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
