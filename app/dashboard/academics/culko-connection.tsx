'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  ExternalLink, RefreshCw, Loader2, GraduationCap,
  Calendar, CheckCircle2, Link2, Terminal, Eye, EyeOff, AlertCircle
} from 'lucide-react'
import { usePortalStore } from '@/store/usePortalStore'

import { getApiUrl } from '@/lib/api-config'

type Step = 'credentials' | 'waiting' | 'captcha' | 'submitting' | 'done'

export default function CULKOConnectionManager() {
  const router = useRouter()
  const [uid, setUid] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [captchaImage, setCaptchaImage] = useState<string | null>(null)
  const [captchaText, setCaptchaText] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [step, setStep] = useState<Step>('credentials')
  const [isConnected, setIsConnected] = useState(false)
  const [statusMsg, setStatusMsg] = useState('Starting browser...')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    // Use persisted store status first for instant render
    const storeStatus = usePortalStore.getState().portalStatus
    if (storeStatus === 'connected') setIsConnected(true)
    checkConnection()
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  const checkConnection = async () => {
    try {
      const { culkoCookies } = usePortalStore.getState()
      const res = await fetch(getApiUrl('/api/culko/status'), {
        headers: {
          'x-culko-session': culkoCookies ? JSON.stringify(culkoCookies) : ''
        }
      })
      if (res.ok) {
        const data = await res.json()
        setIsConnected(data.connected)
      } else {
        setIsConnected(false)
      }
    } catch {
      setIsConnected(false)
    }
  }

  const handleDisconnect = async () => {
    const { culkoCookies, clearData } = usePortalStore.getState()
    setIsConnected(false)
    await fetch(getApiUrl('/api/culko/logout'), {
      headers: {
        'x-culko-session': culkoCookies ? JSON.stringify(culkoCookies) : ''
      }
    })
    clearData()
    toast.info('Session disconnected')
  }

  const handleInit = async () => {
    if (!uid.trim() || !password.trim()) return
    setStep('waiting')
    setStatusMsg('Connecting to portal...')

    try {
      const res = await fetch(getApiUrl('/api/culko/login/init'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, password }),
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error || 'Failed to connect')

      if (data.status === 'captcha_ready') {
        setSessionId(data.sessionId)
        setCaptchaImage(data.captchaImage)
        setStep('captcha')
        toast.success('CAPTCHA loaded!')
      }
    } catch (e: any) {
      setStep('credentials')
      toast.error(e.message || 'Could not connect to scraper backend')
    }
  }

  const handleSubmitCaptcha = async () => {
    if (!captchaText.trim() || !sessionId) return
    setStep('submitting')
    setStatusMsg('Verifying credentials...')

    try {
      const res = await fetch(getApiUrl('/api/culko/login/submit'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, captchaText }),
      })
      const data = await res.json()
      
      if (!res.ok) {
        const errMsg = data.error || 'Login failed'
        
        // Wrong password/UID → back to CREDENTIALS step
        if (errMsg.toLowerCase().includes('password') || errMsg.toLowerCase().includes('user id') || errMsg.toLowerCase().includes('incorrect')) {
          toast.error(errMsg)
          handleReset() // Goes to credentials
          return
        }
        
        // Wrong captcha → fetch a FRESH captcha (re-init with same params)
        if (errMsg.toLowerCase().includes('captcha')) {
          toast.error('Wrong CAPTCHA — loading a new one...')
          setCaptchaText('')
          setStep('waiting')
          setStatusMsg('Fetching new CAPTCHA...')
          // Re-use same UID/pass to get fresh captcha
          await handleInit()
          return
        }
        
        throw new Error(errMsg)
      }

      if (data.status === 'done') {
        if (data.cookies) {
          usePortalStore.getState().setPortalCookies(data.cookies)
        }
        // IMMEDIATELY mark as connected in the store — mobile sees this instantly
        usePortalStore.getState().setPortalStatus('connected')
        
        setIsConnected(true)
        setStep('done')
        toast.success('Portal connected! Syncing your data...')
        
        // Sync in background — don't block the success UI
        usePortalStore.getState().syncAll().catch(err => {
          console.warn('[CULKOConnection] Background sync warning:', err)
        })
      }
    } catch (e: any) {
      setStep('captcha')
      toast.error(e.message || 'Verification failed. Try again.')
    }
  }

  const handleReset = () => {
    setStep('credentials')
    setCaptchaImage(null)
    setCaptchaText('')
    setSessionId(null)
  }

  const inputClass = "w-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-foreground placeholder:text-muted-foreground/50 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all"
  const inputStyle = {}

  if (isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-8 max-w-xl mx-auto text-center space-y-6 border border-primary/20 glow-olive-sm"
      >
        <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-black text-foreground">Portal Synced!</h3>
          <p className="text-muted-foreground mt-2 text-sm">
            Your session is active. Attendance, marks, and timetable are live.
          </p>
        </div>
        <div className="flex justify-center gap-3 flex-wrap">
          <button
            onClick={() => router.push('/dashboard/attendance')}
            className="glass border border-black/10 dark:border-white/10 text-foreground font-semibold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 hover:border-primary/30 transition-all"
          >
            <GraduationCap className="w-4 h-4 text-primary" /> Attendance
          </button>
          <button
            onClick={() => router.push('/dashboard/marks')}
            className="glass border border-black/10 dark:border-white/10 text-foreground font-semibold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 hover:border-primary/30 transition-all"
          >
            <Calendar className="w-4 h-4 text-primary" /> Marks
          </button>
        </div>
        <button
          onClick={handleDisconnect}
          className="text-xs text-muted-foreground hover:text-destructive transition-colors"
        >
          Disconnect session
        </button>
      </motion.div>
    )
  }

  return (
    <div className="glass rounded-2xl p-6 max-w-xl mx-auto border border-white/8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
          <Link2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-black text-foreground">CULKO Portal Sync</h3>
          <p className="text-xs text-muted-foreground">Automated login — just solve the CAPTCHA</p>
        </div>
      </div>

      {/* How it works */}
      <div className="flex gap-3 text-xs text-muted-foreground">
        {['Enter UID + Password', 'Solve CAPTCHA', 'Data goes live'].map((t, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-primary/20 text-primary font-bold text-[10px] flex items-center justify-center shrink-0">{i + 1}</span>
            <span>{t}</span>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── CREDENTIALS STEP ── */}
        {step === 'credentials' && (
          <motion.div key="creds" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">UID</label>
              <input type="text" placeholder="25LBCS3067" value={uid} onChange={e => setUid(e.target.value)} className={inputClass} style={inputStyle} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Password</label>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} placeholder="Your portal password" value={password} onChange={e => setPassword(e.target.value)} className={`${inputClass} pr-12`} style={inputStyle}
                  onKeyDown={e => { if (e.key === 'Enter') handleInit() }}
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <motion.button
              onClick={handleInit}
              disabled={!uid.trim() || !password.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-primary text-background font-black py-3.5 rounded-xl flex items-center justify-center gap-2 glow-olive-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Terminal className="w-4 h-4" /> Connect to CULKO
            </motion.button>
          </motion.div>
        )}

        {/* ── WAITING STEP ── */}
        {step === 'waiting' && (
          <motion.div key="wait" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-8 space-y-4">
            <div className="relative mx-auto w-16 h-16">
              <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
            <div>
              <p className="font-bold text-foreground">{statusMsg}</p>
              <p className="text-xs text-muted-foreground mt-1">This takes 15–30 seconds. Portal is loading...</p>
            </div>
            <button onClick={handleReset} className="text-xs text-muted-foreground hover:text-destructive transition-colors mt-4">Cancel</button>
          </motion.div>
        )}

        {/* ── CAPTCHA STEP ── */}
        {step === 'captcha' && (
          <motion.div key="captcha" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="rounded-xl overflow-hidden border border-black/10 dark:border-white/10 bg-white p-3 flex items-center justify-center">
              {captchaImage ? (
                <img src={captchaImage} alt="CAPTCHA" className="max-h-20 object-contain" />
              ) : (
                <div className="w-48 h-16 bg-black/10 dark:bg-white/10 animate-pulse rounded" />
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Type the CAPTCHA</label>
              <input
                type="text"
                placeholder="Enter characters exactly"
                value={captchaText}
                onChange={e => setCaptchaText(e.target.value)}
                autoFocus
                className={`${inputClass} text-center text-xl tracking-[0.5em] font-mono`}
                style={inputStyle}
                onKeyDown={e => { if (e.key === 'Enter' && captchaText.trim()) handleSubmitCaptcha() }}
              />
            </div>
            <div className="flex gap-3">
              <button onClick={handleReset} className="flex-1 glass border border-black/10 dark:border-white/10 text-foreground font-semibold py-3 rounded-xl text-sm hover:border-black/20 dark:border-white/20 transition-all">Cancel</button>
              <motion.button
                onClick={handleSubmitCaptcha}
                disabled={!captchaText.trim()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 bg-primary text-background font-black py-3 rounded-xl text-sm disabled:opacity-40 glow-olive-sm"
              >
                Submit & Login
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ── SUBMITTING STEP ── */}
        {step === 'submitting' && (
          <motion.div key="submit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-8 space-y-4">
            <div className="relative mx-auto w-16 h-16">
              <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
            <div>
              <p className="font-bold text-foreground">{statusMsg}</p>
              <p className="text-xs text-muted-foreground mt-1">Almost done, logging you in...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
