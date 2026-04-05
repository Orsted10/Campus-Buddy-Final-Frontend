'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { ExternalLink, Save, RefreshCw, Loader2, GraduationCap, Calendar, Clock } from 'lucide-react'

export default function CULKOConnectionManager() {
  const [uid, setUid] = useState('')
  const [password, setPassword] = useState('')
  const [captchaImage, setCaptchaImage] = useState<string | null>(null)
  const [captchaText, setCaptchaText] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loginStep, setLoginStep] = useState<'credentials' | 'captcha'>('credentials')
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  // Keep just connection checking logic
  useEffect(() => {
    checkConnectionStatus()
  }, [])

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/culko?endpoint=profile')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setIsConnected(true)
        }
      }
    } catch (error) {
      console.error('Connection check failed:', error)
    }
  }

  // Monitor & Manual handlers removed as per user request to simplify

  const handleAutomatedLoginInit = async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/culko/login/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, password })
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to initiate login')
      }
      
      if (data.requireCaptcha) {
        setCaptchaImage(data.captchaImage)
        setSessionId(data.sessionId)
        setLoginStep('captcha')
        toast.success('Please solve the CAPTCHA')
        // Fallback if somehow it logged in without captcha
        setIsConnected(true)
        toast.success('Connected automatically!')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to connect to CULKO')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAutomatedLoginSubmit = async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/culko/login/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, captchaText })
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        // Reset process on failure
        setLoginStep('credentials')
        setCaptchaImage(null)
        setSessionId(null)
        setCaptchaText('')
        throw new Error(data.error || 'Failed to login with CAPTCHA')
      }
      
      setIsConnected(true)
      setLoginStep('credentials') // reset for future
      toast.success('CULKO session connected automatically!')
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to connect to CULKO')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="w-5 h-5" />
          CULKO Portal Connection
        </CardTitle>
        <CardDescription>
          Connect to Chandigarh University Lucknow student portal to fetch attendance, marks, and timetable
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!isConnected ? (
          <>
            <div className="space-y-2">
              <h3 className="font-semibold">Automated Login</h3>
              <p className="text-sm text-muted-foreground">
                Enter your CULKO credentials. We will show you the CAPTCHA to solve, then finish the login for you!
              </p>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground mt-2">
                <li>Enter your UID (e.g., 25LBCS3067)</li>
                <li>Enter your password</li>
                <li>Click "Connect to CULKO"</li>
                <li>Solve the CAPTCHA image shown to you</li>
              </ol>
            </div>
            
            {loginStep === 'credentials' ? (
              <>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">UID</label>
                    <input
                      type="text"
                      placeholder="25LBCS3067"
                      value={uid}
                      onChange={(e) => setUid(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-1 block">Password</label>
                    <input
                      type="password"
                      placeholder="Your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={handleAutomatedLoginInit} 
                  disabled={isLoading || !uid.trim() || !password.trim()} 
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Navigating to portal...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Connect to CULKO
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-3 bg-muted p-4 rounded-lg flex flex-col items-center">
                  <p className="font-medium">Solve CAPTCHA</p>
                  {captchaImage ? (
                    <img src={captchaImage} alt="CULKO CAPTCHA" className="border rounded bg-white p-2 w-48" />
                  ) : (
                    <div className="w-48 h-12 bg-gray-200 animate-pulse rounded" />
                  )}
                  
                  <div className="w-full mt-2">
                    <input
                      type="text"
                      placeholder="Enter characters"
                      value={captchaText}
                      onChange={(e) => setCaptchaText(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md bg-background text-center text-lg tracking-widest font-mono"
                      autoComplete="off"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && captchaText.trim()) {
                          handleAutomatedLoginSubmit()
                        }
                      }}
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setLoginStep('credentials')
                      setCaptchaImage(null)
                      setSessionId(null)
                    }}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAutomatedLoginSubmit} 
                    disabled={isLoading || !captchaText.trim()} 
                    className="flex-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      'Submit & Login'
                    )}
                  </Button>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="space-y-6 text-center py-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                <ExternalLink className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold">Portal Synced Successfully</h3>
              <p className="text-muted-foreground mt-2">
                Your authentication cookie is active. You can now access your live academic data.
              </p>
            </div>
            
            <div className="mt-6 flex justify-center gap-4">
              <Button onClick={() => window.location.href = '/dashboard/attendance'} variant="outline">
                <GraduationCap className="w-4 h-4 mr-2" />
                View Attendance
              </Button>
              <Button onClick={() => window.location.href = '/dashboard/marks'} variant="outline">
                <Calendar className="w-4 h-4 mr-2" />
                View Marks
              </Button>
            </div>

            <Button 
              onClick={() => {
                setIsConnected(false)
                setSessionId(null)
              }} 
              variant="ghost"
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              Disconnect Session
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
