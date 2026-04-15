'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { 
  Sparkles, 
  ArrowRight, 
  GraduationCap, 
  User, 
  ShieldCheck,
  LayoutDashboard,
  LogOut,
  Loader2
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'

export default function OnboardingPage() {
  const { user, needsOnboarding, loading, signOut } = useAuth()
  const [studentId, setStudentId] = useState('')
  const [fullName, setFullName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Pre-fill full name from user meta if available
  useEffect(() => {
    if (user?.full_name && !fullName) {
      setFullName(user.full_name)
    }
  }, [user, fullName])

  // If already onboarded, redirect to dashboard
  useEffect(() => {
    if (!loading && user) {
      if (!needsOnboarding) {
        router.replace('/dashboard')
      }
    } else if (!loading && !user) {
      // If we finished loading and there's NO user, go back to login
      router.replace('/login')
    }
  }, [loading, needsOnboarding, user, router])

  const handleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentId.trim()) {
      toast.error('Please enter your Student UID')
      return
    }

    setIsSubmitting(true)
    try {
      // 1. Get UID directly from session to be 100% sure we don't hit null
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      const userId = session?.user?.id

      if (sessionError || !userId) {
        throw new Error('Your session has expired. Please log in again.')
      }

      // 2. Use upsert instead of update to handle cases where the SQL trigger 
      // might have lagged or was not yet installed.
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: userId,
          student_id: studentId.toUpperCase(),
          full_name: fullName,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Upsert error details:', error)
        throw error
      }

      toast.success('Profile completed! Welcome aboard.')
      // Hard refresh with safety parameter to break potential middleware loops
      window.location.href = '/dashboard?onboarding_success=true'
    } catch (err: any) {
      toast.error(err.message || 'Failed to complete profile')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-background">
       <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 flex items-center justify-center overflow-hidden mesh-bg">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg glass-strong rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden"
      >
        {/* Animated Accent Bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
        
        <div className="p-8 md:p-12 space-y-8">
           {/* Header */}
           <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 mx-auto flex items-center justify-center mb-4 glow-olive-sm">
                 <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl font-black text-white tracking-tighter">
                Complete Your <span className="text-gradient">Elite Profile</span>
              </h1>
              <p className="text-muted-foreground text-sm font-medium">
                Welcome, {user?.full_name?.split(' ')[0] || 'Buddy'}! We just need a few details to get your dashboard ready.
              </p>
           </div>

           <form onSubmit={handleOnboarding} className="space-y-6">
              {/* Full Name */}
              <div className="space-y-2">
                 <label className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    Display Name
                 </label>
                 <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      type="text"
                      placeholder="Your name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="w-full bg-surface-2 border border-white/8 text-white placeholder:text-muted-foreground/30 rounded-2xl px-12 py-3.5 text-sm font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                      style={{ backgroundColor: 'oklch(0.14 0.018 120)' }}
                    />
                 </div>
              </div>

              {/* Student UID */}
              <div className="space-y-2">
                 <label className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    University UID (Student ID)
                 </label>
                 <div className="relative group">
                    <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      type="text"
                      placeholder="e.g. 25LBCS3067"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      required
                      className="w-full bg-surface-2 border border-white/8 text-white placeholder:text-muted-foreground/30 rounded-2xl px-12 py-3.5 text-sm font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all uppercase"
                      style={{ backgroundColor: 'oklch(0.14 0.018 120)' }}
                    />
                 </div>
                 <p className="text-[10px] text-muted-foreground/50 font-bold ml-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3 text-primary/50" />
                    This is required for syncing your CULKO academic portal
                 </p>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                 <motion.button
                   type="submit"
                   disabled={isSubmitting}
                   whileHover={{ scale: 1.02, y: -2 }}
                   whileTap={{ scale: 0.98 }}
                   className="w-full h-14 bg-primary text-background font-black rounded-2xl flex items-center justify-center gap-3 shadow-lg glow-olive-sm hover:glow-olive transition-all disabled:opacity-60"
                 >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <span className="uppercase tracking-widest text-xs">Enter Dashboard</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                 </motion.button>
                 
                 <button 
                   type="button"
                   onClick={() => signOut()}
                   className="flex items-center justify-center gap-2 text-xs font-black text-muted-foreground hover:text-white transition-colors py-2"
                 >
                    <LogOut className="w-3 h-3" />
                    SIGN OUT & CANCEL
                 </button>
              </div>
           </form>
        </div>

        {/* Footer Accent */}
        <div className="p-6 bg-white/[0.02] border-t border-white/5 flex items-center justify-center gap-4">
           <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-[#0a0a0a] bg-surface-2 overflow-hidden">
                   <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} alt="user avatar" />
                </div>
              ))}
           </div>
           <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
              Joined by 500+ Students this month
           </span>
        </div>
      </motion.div>
    </div>
  )
}
