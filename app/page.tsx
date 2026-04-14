'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { MessageSquare, Building, BookOpen, MapPin, Shield, Zap, ChevronRight, Terminal, Star, TrendingUp, Users } from 'lucide-react'

const features = [
  {
    icon: Terminal,
    title: 'Live Portal Sync',
    description: 'Directly mirrors your CULKO portal — attendance, marks, timetable, all live.',
    color: 'from-olive to-cyber-green',
  },
  {
    icon: MessageSquare,
    title: 'Context-Aware AI',
    description: 'Ask "What is my attendance?" and the AI responds with YOUR actual data, no redirects.',
    color: 'from-emerald-500 to-teal-400',
  },
  {
    icon: BookOpen,
    title: 'Academic Dashboard',
    description: 'Grades with colour-coded performance, subject-wise breakdowns and insights.',
    color: 'from-lime-500 to-green-400',
  },
  {
    icon: Building,
    title: 'Hostel & Mess',
    description: 'Raise maintenance requests, view mess menu, and manage campus life.',
    color: 'from-yellow-500 to-orange-400',
  },
  {
    icon: MapPin,
    title: 'Campus Navigation',
    description: 'Interactive campus map with turn-by-turn directions to every block.',
    color: 'from-pink-500 to-rose-400',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Row-level security via Supabase. Your data never leaves your session.',
    color: 'from-blue-500 to-indigo-400',
  },
]

const stats = [
  { label: 'Active Students', value: '2,400+', icon: Users },
  { label: 'Queries Resolved', value: '18,000+', icon: MessageSquare },
  { label: 'Uptime', value: '99.9%', icon: TrendingUp },
  { label: 'Stars on GitHub', value: '240+', icon: Star },
]

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' },
  }),
}

import { isNativeApp } from '@/lib/api-config'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function LandingPage() {
  const isApp = isNativeApp()
  const router = useRouter()
  const [checkingAuth, setCheckingAuth] = useState(true)

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

  // Don't show anything while checking auth to prevent flicker
  if (checkingAuth) return null

  // NATIVE APP INTRO SCREEN (Discord/YouTube Style)
  if (isApp) {
    return (
      <div className="h-screen w-full bg-background overflow-hidden relative flex flex-col pt-safe pb-safe mesh-bg">
        {/* Immersive Background Orbs */}
        <div className="absolute top-[-10%] left-[-20%] w-[150%] h-[60%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[120%] h-[50%] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-24 h-24 rounded-[2rem] bg-primary flex items-center justify-center mb-8 glow-olive shadow-2xl"
          >
            <span className="text-background font-black text-3xl">CB</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-5xl font-black tracking-tighter text-white mb-4 text-center leading-tight"
          >
            Campus<br/><span className="text-gradient">Buddy</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-muted-foreground text-center max-w-[280px] font-medium leading-relaxed"
          >
            Your university life, supercharged. Live updates, AI assistance, and more.
          </motion.p>
        </div>

        {/* Action Buttons at the Bottom */}
        <div className="px-6 pb-12 space-y-4 relative z-10 w-full">
          <Link href="/login" className="block w-full">
            <motion.button
              whileTap={{ scale: 0.96 }}
              className="w-full bg-primary text-background font-black py-5 rounded-[1.5rem] tracking-widest uppercase text-sm glow-olive-sm shadow-xl"
            >
              Sign In
            </motion.button>
          </Link>
          
          <Link href="/signup" className="block w-full">
            <motion.button
              whileTap={{ scale: 0.96 }}
              className="w-full glass border border-white/10 text-white font-black py-5 rounded-[1.5rem] tracking-widest uppercase text-sm"
            >
              Create Account
            </motion.button>
          </Link>

          <div className="pt-4 flex items-center justify-center gap-6 opacity-30">
             <div className="flex flex-col items-center">
                <span className="text-[10px] font-black uppercase tracking-tighter">Active Sync</span>
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse mt-1" />
             </div>
             <div className="w-px h-6 bg-white/20" />
             <div className="flex flex-col items-center">
                <span className="text-[10px] font-black uppercase tracking-tighter">Secure Link</span>
                <Shield className="w-2.5 h-2.5 mt-1" />
             </div>
          </div>
        </div>
      </div>
    )
  }

  // STANDARD WEB MARKETING LANDING
  return (
    <div className="min-h-screen bg-background text-foreground mesh-bg overflow-x-hidden">
      {/* ====================== NAV ====================== */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 glass border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center glow-olive-sm">
            <span className="text-background font-black text-sm">CB</span>
          </div>
          <span className="font-black text-lg text-gradient">Campus Buddy</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-semibold text-muted-foreground hover:text-white transition-colors px-4 py-2">
            Sign In
          </Link>
          <Link href="/signup">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="bg-primary text-background font-bold text-sm px-5 py-2.5 rounded-xl glow-olive-sm hover:glow-olive transition-all"
            >
              Get Started
            </motion.button>
          </Link>
        </div>
      </nav>

      {/* ====================== HERO ====================== */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center pt-24 pb-16">
        {/* Ambient Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="badge-tech mb-6"
        >
          ⚡ Built for CULKO University Students
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-none mb-6"
        >
          Your Campus,
          <br />
          <span className="text-gradient">Supercharged.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed"
        >
          Attendance, marks, timetable — all pulled live from your portal.
          An AI that actually knows YOUR data and talks to you about it.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href="/signup">
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: '0 0 30px rgba(160,210,80,0.35)' }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 bg-primary text-background font-bold text-base px-8 py-4 rounded-2xl glow-olive transition-all"
            >
              Start Free <ChevronRight className="w-5 h-5" />
            </motion.button>
          </Link>
          <Link href="#features">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 glass text-white font-bold text-base px-8 py-4 rounded-2xl border border-white/10 transition-all"
            >
              See Features
            </motion.button>
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl w-full"
        >
          {stats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <div key={i} className="glass rounded-2xl p-5 text-center group hover:glow-olive-sm transition-all">
                <Icon className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-2xl font-black text-white">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">{stat.label}</p>
              </div>
            )
          })}
        </motion.div>
      </section>

      {/* ====================== FEATURES ====================== */}
      <section id="features" className="relative px-6 md:px-12 py-28">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="badge-tech mb-4 inline-block">Features</div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
              Everything in <span className="text-gradient">one terminal.</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Stop switching between tabs. Campus Buddy brings your entire academic life to one intelligent hub.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ delay: i * 0.08, duration: 0.5, ease: 'easeOut' }}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  className="glass rounded-2xl p-6 group border border-white/5 hover:border-primary/20 hover:glow-olive-sm transition-all duration-300"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${feature.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ====================== CTA ====================== */}
      <section className="px-6 md:px-12 py-28">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto glass-strong rounded-3xl p-12 text-center relative overflow-hidden border-glow-animate"
        >
          {/* Ambient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5 pointer-events-none" />
          
          <div className="badge-tech mb-6 inline-block relative z-10">Ready to join?</div>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-4 relative z-10">
            Stop guessing.<br/>
            <span className="text-gradient">Start knowing.</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto relative z-10">
            Connect your CULKO portal once. Ask anything. Get answers backed by real, live academic data.
          </p>
          <Link href="/signup" className="relative z-10 inline-block">
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: '0 0 40px rgba(160,210,80,0.4)' }}
              whileTap={{ scale: 0.97 }}
              className="bg-primary text-background font-black text-lg px-10 py-4 rounded-2xl glow-olive transition-all"
            >
              Create Free Account →
            </motion.button>
          </Link>
        </motion.div>
      </section>

      {/* ====================== FOOTER ====================== */}
      <footer className="border-t border-white/5 px-6 md:px-12 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <span className="text-background font-black text-[10px]">CB</span>
            </div>
            <span className="text-sm font-bold text-gradient">Campus Buddy</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2025 Campus Buddy · Built for CULKO Students</p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="hover:text-white cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-white cursor-pointer transition-colors">Terms</span>
            <span className="hover:text-white cursor-pointer transition-colors">Contact</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
