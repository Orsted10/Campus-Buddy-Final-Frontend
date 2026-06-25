'use client'

import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { MessageSquare, Building, BookOpen, MapPin, Shield, ChevronRight, Terminal, Star, TrendingUp, Users, ArrowRight, Sparkles } from 'lucide-react'
import { isNativeApp } from '@/lib/api-config'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'

const features = [
  {
    icon: Terminal,
    title: 'Live Portal Sync',
    description: 'Directly mirrors your CULKO portal. Attendance, marks, and timetable sync in real-time securely.',
    className: "md:col-span-2 md:row-span-2",
  },
  {
    icon: MessageSquare,
    title: 'Context-Aware AI',
    description: 'Ask "What is my attendance?" and the AI responds with YOUR actual data immediately.',
    className: "md:col-span-1 md:row-span-1",
  },
  {
    icon: Shield,
    title: 'Bank-Grade Privacy',
    description: 'Row-level security via Supabase. Your credentials never leave your session.',
    className: "md:col-span-1 md:row-span-1",
  },
  {
    icon: BookOpen,
    title: 'Academic Dashboard',
    description: 'Color-coded performance metrics and deep academic insights.',
    className: "md:col-span-1 md:row-span-1",
  },
  {
    icon: Building,
    title: 'Campus Life',
    description: 'Mess menus, hostel passes, and facility booking natively integrated.',
    className: "md:col-span-1 md:row-span-1",
  },
  {
    icon: MapPin,
    title: 'Intelligent Maps',
    description: 'Turn-by-turn navigation for your specific campus.',
    className: "md:col-span-2 md:row-span-1",
  },
]

const stats = [
  { label: 'Active Students', value: '2.4k+', icon: Users },
  { label: 'Queries Solved', value: '18k+', icon: MessageSquare },
  { label: 'Uptime', value: '99.9%', icon: TrendingUp },
  { label: 'GitHub Stars', value: '240+', icon: Star },
]

export default function LandingPage() {
  const isApp = isNativeApp()
  const router = useRouter()
  const [checkingAuth, setCheckingAuth] = useState(true)
  const targetRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"]
  })
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  useEffect(() => {
    async function checkUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        router.push('/dashboard')
      } else {
        setCheckingAuth(false)
      }
    }
    checkUser()
  }, [router])

  if (checkingAuth) return null

  // NATIVE APP INTRO
  if (isApp) {
    return (
      <div className="h-screen w-full bg-background overflow-hidden relative flex flex-col pt-safe pb-safe dot-pattern">
        <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[60%] bg-primary/20 rounded-full blur-[140px] pointer-events-none" />
        
        <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-8 shadow-premium-2xl glow-primary"
          >
            <span className="text-white font-bold text-3xl tracking-tighter">CB</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
            className="text-5xl font-black tracking-tight text-foreground mb-4 text-center leading-tight"
          >
            Campus<br/><span className="text-gradient">Buddy</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-muted-foreground text-center max-w-[280px] font-medium leading-relaxed"
          >
            The premium academic terminal. Everything you need, intelligently automated.
          </motion.p>
        </div>

        <div className="px-6 pb-12 space-y-4 relative z-10 w-full">
          <Link href="/login" className="block w-full">
            <motion.button
              whileTap={{ scale: 0.96 }}
              className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-2xl text-[15px] shadow-premium-lg glow-primary-sm transition-all"
            >
              Log In
            </motion.button>
          </Link>
          
          <Link href="/signup" className="block w-full">
            <motion.button
              whileTap={{ scale: 0.96 }}
              className="w-full glass-strong text-foreground font-semibold py-4 rounded-2xl text-[15px] transition-all"
            >
              Create Account
            </motion.button>
          </Link>
        </div>
      </div>
    )
  }

  // STANDARD WEB LANDING
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/30 selection:text-primary">
      
      {/* GLOBAL NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 glass border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-premium-sm">
            <span className="text-white font-bold text-xs tracking-tighter">CB</span>
          </div>
          <span className="font-semibold text-[15px] tracking-tight">Campus Buddy</span>
        </div>
        <div className="flex items-center gap-1 md:gap-4">
          <Link href="/login" className="text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors px-4 py-2 hidden sm:block">
            Sign In
          </Link>
          <Link href="/signup">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-foreground text-background font-medium text-[14px] px-5 py-2.5 rounded-full shadow-premium-sm hover:shadow-premium-md transition-all"
            >
              Get Started
            </motion.button>
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section ref={targetRef} className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center pt-32 pb-20 overflow-hidden">
        {/* Ambient Blur */}
        <motion.div 
          style={{ y, opacity }}
          className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/15 rounded-full blur-[120px] pointer-events-none" 
        />

        <motion.div
          initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center relative z-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-border text-xs font-semibold tracking-wide text-muted-foreground mb-8">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Campus Buddy 2.0 is here</span>
          </div>

          <h1 className="text-[3.5rem] md:text-[5.5rem] lg:text-[7rem] font-bold tracking-[-0.04em] leading-[0.9] mb-8 text-foreground max-w-5xl">
            The intelligent OS for your <span className="text-gradient">university.</span>
          </h1>

          <p className="text-[17px] md:text-[20px] text-muted-foreground max-w-2xl mb-12 leading-relaxed tracking-tight font-medium">
            Seamlessly integrating live portal data, AI assistance, and campus management into one beautifully engineered terminal.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto">
            <Link href="/signup">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-foreground text-background font-semibold text-[15px] px-8 py-4 rounded-full shadow-premium-lg transition-all"
              >
                Start for free
              </motion.button>
            </Link>
            <Link href="#features">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 glass-strong text-foreground font-semibold text-[15px] px-8 py-4 rounded-full transition-all"
              >
                Explore platform
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Hero Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-28 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-5xl w-full relative z-10"
        >
          {stats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <div key={i} className="flex flex-col items-center text-center p-4">
                <Icon className="w-5 h-5 text-primary/60 mb-3" />
                <p className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-1">{stat.value}</p>
                <p className="text-[13px] text-muted-foreground font-medium">{stat.label}</p>
              </div>
            )
          })}
        </motion.div>
      </section>

      {/* BENTO GRID FEATURES SECTION */}
      <section id="features" className="relative px-6 md:px-12 py-32 bg-secondary/30 border-y border-border/40">
        <div className="max-w-6xl mx-auto">
          <div className="mb-20">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 max-w-2xl">
              Everything you need.<br/>
              <span className="text-muted-foreground">Engineered to perfection.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 auto-rows-[240px] md:auto-rows-[280px] gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -4, scale: 0.995 }}
                  className={`glass-strong rounded-[2rem] p-8 md:p-10 flex flex-col justify-between group overflow-hidden relative ${feature.className}`}
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[60px] transform translate-x-1/2 -translate-y-1/2 group-hover:bg-primary/10 transition-colors duration-500" />
                  
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-background border border-border flex items-center justify-center mb-6 shadow-premium-sm group-hover:scale-105 transition-transform duration-500">
                      <Icon className="w-6 h-6 text-foreground" />
                    </div>
                  </div>
                  
                  <div className="relative z-10 mt-auto">
                    <h3 className="text-xl md:text-2xl font-bold tracking-tight text-foreground mb-3">{feature.title}</h3>
                    <p className="text-[15px] text-muted-foreground leading-relaxed font-medium max-w-sm">{feature.description}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* MAGNETIC CTA SECTION */}
      <section className="px-6 md:px-12 py-32 md:py-48 relative overflow-hidden">
        <div className="absolute inset-0 bg-background dot-pattern opacity-50 pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl mx-auto glass rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-premium-2xl border border-border/60"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
          
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 relative z-10">
            Ready to upgrade?
          </h2>
          <p className="text-[18px] text-muted-foreground mb-10 max-w-xl mx-auto relative z-10 font-medium leading-relaxed">
            Join thousands of students experiencing the next generation of academic management. Free forever.
          </p>
          <Link href="/signup" className="relative z-10 inline-block group">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-primary text-primary-foreground font-semibold text-[16px] px-10 py-5 rounded-full shadow-premium-lg glow-primary flex items-center gap-3 transition-all"
            >
              Start for free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </Link>
        </motion.div>
      </section>

      {/* MINIMAL FOOTER */}
      <footer className="border-t border-border/40 px-6 md:px-12 py-12 bg-background relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-md bg-foreground flex items-center justify-center">
              <span className="text-background font-bold text-[9px] tracking-tighter">CB</span>
            </div>
            <span className="text-[14px] font-semibold tracking-tight text-foreground">Campus Buddy</span>
          </div>
          <p className="text-[13px] text-muted-foreground font-medium">© 2026 Campus Buddy. Designed for students.</p>
          <div className="flex gap-6 text-[13px] font-medium text-muted-foreground">
            <span className="hover:text-foreground cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-foreground cursor-pointer transition-colors">Terms</span>
            <span className="hover:text-foreground cursor-pointer transition-colors">Contact</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
