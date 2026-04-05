'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function TestPage() {
  const [status, setStatus] = useState<string>('Testing...')
  const [details, setDetails] = useState<any>(null)

  const testConnection = async () => {
    setStatus('Testing Supabase connection...')
    
    try {
      const supabase = createClient()
      
      // Test 1: Check if tables exist (without authentication)
      const { data: healthData, error: healthError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1)
      
      if (healthError) {
        // Check if it's a permissions error (expected when not logged in)
        if (healthError.code === '42501') {
          setStatus('✅ Database Connected (RLS Active)')
          setDetails({
            status: 'Tables exist and RLS is working correctly',
            note: 'Permission denied is expected when not logged in',
            nextStep: 'Sign up or login to access protected routes'
          })
          return
        }
        
        setStatus('❌ Database Error')
        setDetails({
          error: healthError.message,
          hint: 'Make sure you ran database_schema.sql in Supabase SQL Editor',
          code: healthError.code
        })
        return
      }

      // Test 2: Check auth
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        setStatus('⚠️ Auth Error')
        setDetails({
          error: authError.message,
          user: null
        })
        return
      }

      setStatus('✅ All Systems Working!')
      setDetails({
        database: 'Connected',
        authenticated: user ? 'Yes' : 'No',
        user: user ? {
          email: user.email,
          id: user.id
        } : 'Not logged in',
        nextStep: user ? 'Go to /dashboard' : 'Sign up at /signup'
      })

    } catch (error: any) {
      setStatus('❌ Unexpected Error')
      setDetails({
        error: error.message,
        stack: error.stack
      })
    }
  }

  useEffect(() => {
    testConnection()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">🔧 System Diagnostics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-lg font-semibold mb-2">Status: {status}</p>
          </div>

          {details && (
            <div className="p-4 bg-card border rounded-lg">
              <pre className="text-sm overflow-auto whitespace-pre-wrap">
                {JSON.stringify(details, null, 2)}
              </pre>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={testConnection}>
              Test Again
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/signup'}>
              Go to Sign Up
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/login'}>
              Go to Login
            </Button>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
            <h3 className="font-semibold mb-2">Common Issues:</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Database error = You haven't run database_schema.sql yet</li>
              <li>Auth error = Supabase credentials might be wrong</li>
              <li>Network error = Check your internet connection</li>
              <li>After signing up, check your email for verification</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
