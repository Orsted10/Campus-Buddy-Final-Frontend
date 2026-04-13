'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { usePortalStore } from '@/store/usePortalStore'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bell, ExternalLink, GraduationCap, Clock, 
  Calendar as CalendarIcon, Utensils, AlertTriangle, 
  ChevronRight, ArrowRight, Zap, BookOpen, 
  RefreshCw, MapPin, Settings as SettingsIcon,
  Smile, Sun, Moon, Coffee
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getISTDate, isBetweenTimings, parseTimeString } from '@/lib/utils-date'
import { MESS_MENU, ACADEMIC_CALENDAR_2026 } from '@/lib/constants'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const user = useAuthStore((state: any) => state.user)
  const { notifications, setNotifications } = useNotificationStore()
  const router = useRouter()

  const [currentTime, setCurrentTime] = useState(getISTDate())
  const { 
    attendance: attendanceData, 
    timetable: timetableData, 
    portalStatus, 
    isSyncing, 
    syncAll, 
    lastSync 
  } = usePortalStore()

  // Safety Catch: If user is missing (corrupted session), redirect immediately
  useEffect(() => {
    if (!user) {
      router.replace('/login')
    }
  }, [user, router])

  // 1. Live Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(getISTDate()), 30000)
    return () => clearInterval(timer)
  }, [])

  // 2. Initial Setup & Background Sync
  const fetchData = async () => {
    if (!user) return
    try {
      // Sync notifications locally
      const notifRes = await fetch('/api/notifications')
      if (notifRes.ok) {
        const notifs = await notifRes.json()
        setNotifications(notifs)
      }
      
      // Global sync for portal data
      await syncAll()
    } catch (err) {
      console.error('Dashboard notif/status update failed:', err)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // 3. Smart Logic: Current Status (Teaching/Holiday)
  const todayStatus = useMemo(() => {
    const dateStr = currentTime.toISOString().split('T')[0]
    const event = ACADEMIC_CALENDAR_2026.find(e => e.date === dateStr)
    if (event) return { type: event.type, name: event.event }
    
    const day = currentTime.getUTCDay()
    if (day === 0) return { type: 'holiday', name: 'Sunday Funday' }
    if (day === 6) return { type: 'holiday', name: 'Saturday Break' }
    return { type: 'teaching', name: 'Teaching Day' }
  }, [currentTime])

  // 4. Smart Logic: Next Meal
  const nextMeal = useMemo(() => {
    const hour = currentTime.getUTCHours() // IST hour (already offset by getISTDate)
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentTime.getUTCDay()]
    const dayMenu = MESS_MENU.schedule.find(s => s.day === dayName) || MESS_MENU.schedule[0]
    
    // Check specific meal windows
    if (hour < 10) return { type: 'Breakfast', menu: dayMenu.breakfast, icon: Coffee, time: MESS_MENU.timings.breakfast }
    if (hour < 15) return { type: 'Lunch', menu: dayMenu.lunch, icon: Utensils, time: MESS_MENU.timings.lunch }
    if (hour < 19) return { type: 'Snacks', menu: dayMenu.snacks, icon: Smile, time: MESS_MENU.timings.snacks }
    return { type: 'Dinner', menu: dayMenu.dinner, icon: Moon, time: MESS_MENU.timings.dinner }
  }, [currentTime])

  // 5. Smart Logic: Current/Next Class
  const classStatus = useMemo(() => {
    const hour = currentTime.getUTCHours()
    const mins = currentTime.getUTCMinutes()
    const absMins = hour * 60 + mins

    // Hardcoded Lunch Break: 1:05 PM to 1:55 PM (IST)
    const lunchStart = 13 * 60 + 5
    const lunchEnd = 13 * 60 + 55
    const isLunchBreak = absMins >= lunchStart && absMins < lunchEnd

    if (!timetableData || typeof timetableData !== 'object' || Array.isArray(timetableData)) return { isLunchBreak, current: null, next: null }
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentTime.getUTCDay()]
    const schedule = timetableData[dayName] || []
    
    // Find current class
    const currentClass = isLunchBreak ? null : schedule.find((c: any) => {
      try {
        const [start, end] = c.time.split(/\s*-\s*/)
        return isBetweenTimings(currentTime, start, end)
      } catch (e) {
        return false
      }
    })

    // Find next class
    const nextClass = schedule.find((c: any) => {
      try {
        const [start] = c.time.split(/\s*-\s*/)
        const [startH, startM] = parseTimeString(start)
        return (startH > hour) || (startH === hour && startM > mins)
      } catch (e) {
        return false
      }
    })

    return {
      isLunchBreak,
      current: currentClass,
      next: nextClass
    }
  }, [timetableData, currentTime])

  // 6. Smart Logic: Attendance Warning
  const lowAttendance = useMemo(() => {
    const validAttendance = Array.isArray(attendanceData) ? attendanceData : []
    return validAttendance.filter(a => {
      const pct = parseFloat(a.percentage)
      return !isNaN(pct) && pct < 75
    })
  }, [attendanceData])

  // Greeting Logic
  const greeting = useMemo(() => {
    const hour = currentTime.getUTCHours()
    if (hour < 12) return { text: 'Good Morning', icon: Coffee }
    if (hour < 17) return { text: 'Good Afternoon', icon: Sun }
    return { text: 'Good Evening', icon: Moon }
  }, [currentTime])

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 pb-20 overflow-x-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <motion.div 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-[0.3em]"
            >
              <Zap className="w-3 h-3" /> Dashboard Elite
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-6xl font-black text-foreground tracking-tighter leading-none"
            >
              {greeting.text}, <span className="text-gradient underline decoration-primary/20">{user?.full_name?.split(' ')[0] || 'Buddy'}</span>
            </motion.h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-muted-foreground font-bold text-[10px] md:text-sm">
                <span className="flex items-center gap-1.5"><CalendarIcon className="w-3 h-3 md:w-4 md:h-4" /> {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-3 h-3 md:w-4 md:h-4" /> {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <motion.button 
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               onClick={() => router.push('/dashboard/settings')}
               className="w-12 h-12 rounded-2xl glass-panel border-black/5 dark:border-white/5 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
             >
                <SettingsIcon className="w-5 h-5" />
             </motion.button>
             <Badge variant="outline" className={`h-12 px-6 rounded-2xl border-black/5 dark:border-white/5 font-black uppercase tracking-widest flex items-center gap-2 ${todayStatus.type === 'teaching' ? 'bg-primary/5 text-primary border-primary/20' : 'bg-blue-500/5 text-blue-400 border-blue-500/20'}`}>
                <div className={`w-2 h-2 rounded-full animate-pulse ${todayStatus.type === 'teaching' ? 'bg-primary' : 'bg-blue-400'}`} />
                {todayStatus.name}
             </Badge>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* 2. SMART TIMELINE (LEFT COL) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
             {/* Next Up Class Widget */}
             <Card className="glass-panel border-black/5 dark:border-white/5 overflow-hidden group">
                <CardHeader className="pb-2">
                   <div className="flex justify-between items-center">
                      <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                         <BookOpen className="w-3 h-3" /> Smart Schedule
                      </CardTitle>
                      <button onClick={() => router.push('/dashboard/timetable')} className="text-[10px] font-black text-primary hover:underline">VIEW FULL</button>
                   </div>
                </CardHeader>
                <CardContent className="space-y-4">
                   {classStatus?.isLunchBreak ? (
                      <div className="relative pl-6 border-l-2 border-orange-500/30 py-1 bg-orange-500/5 rounded-r-lg">
                        <div className="absolute -left-[5px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-orange-500" />
                        <p className="text-[10px] font-black text-orange-500 uppercase">LUNCH BREAK</p>
                        <h3 className="font-black text-foreground text-lg leading-tight">University Lunch</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                           <Clock className="w-3 h-3" /> 01:05 PM - 01:55 PM
                           <span className="w-1 h-1 rounded-full bg-black/10 dark:bg-white/10" />
                           <Utensils className="w-3 h-3" /> MESS
                        </p>
                      </div>
                   ) : classStatus?.current ? (
                     <div className="relative pl-6 border-l-2 border-primary/30 py-1">
                        <div className="absolute -left-[5px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary" />
                        <p className="text-[10px] font-black text-primary uppercase">RIGHT NOW</p>
                        <h3 className="font-black text-foreground text-lg leading-tight group-hover:text-primary transition-colors line-clamp-1">{classStatus.current.subject}</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                           <Clock className="w-3 h-3" /> {classStatus.current.time}
                           <span className="w-1 h-1 rounded-full bg-black/10 dark:bg-white/10" />
                           <MapPin className="w-3 h-3" /> BLOCK E
                        </p>
                     </div>
                   ) : classStatus?.next ? (
                     <div className="relative pl-6 border-l-2 border-primary/20 py-4 bg-primary/5 rounded-r-xl">
                        <div className="absolute -left-[5px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary/50 animate-pulse" />
                        <p className="text-[10px] font-black text-primary/80 uppercase">NOTHING ACTIVE • NEXT UP</p>
                        <h3 className="font-black text-foreground text-xl tracking-tight leading-tight mt-1">{classStatus.next.subject}</h3>
                        <p className="text-sm text-primary font-bold mt-1.5 flex items-center gap-2">
                           <Clock className="w-4 h-4" /> Starts at {classStatus.next.time.split(' - ')[0]}
                        </p>
                     </div>
                   ) : (
                     <div className="py-2 text-center">
                        <p className="text-xs font-bold text-muted-foreground italic">No classes found in schedule</p>
                     </div>
                   )}

                   {!classStatus?.isLunchBreak && classStatus?.current && classStatus?.next && (
                     <div className="relative pl-6 border-l-2 border-black/5 dark:border-black/5 dark:border-white/5 py-1 opacity-50">
                        <div className="absolute -left-[5px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-black/20 dark:bg-black/20 dark:bg-white/20" />
                        <p className="text-[10px] font-black uppercase text-muted-foreground">UP NEXT</p>
                        <h3 className="font-bold text-foreground text-sm line-clamp-1">{classStatus.next.subject}</h3>
                        <p className="text-[10px] text-muted-foreground">{classStatus.next.time}</p>
                     </div>
                   )}
                </CardContent>
             </Card>

             {/* Next Meal Widget */}
             <Card className="glass-panel border-black/5 dark:border-white/5 overflow-hidden bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader className="pb-2">
                   <div className="flex justify-between items-center">
                      <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                         <nextMeal.icon className="w-3 h-3" /> Campus Mess
                      </CardTitle>
                      <button onClick={() => router.push('/dashboard/hostel/mess')} className="text-[10px] font-black text-primary hover:underline">MENU</button>
                   </div>
                </CardHeader>
                <CardContent className="flex items-center gap-4">
                   <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
                      <Utensils className="w-6 h-6 text-primary" />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-primary uppercase">{nextMeal.type} • {nextMeal.time}</p>
                      <h3 className="font-black text-foreground text-base leading-tight mt-0.5">{nextMeal.menu}</h3>
                   </div>
                </CardContent>
             </Card>
          </div>

          {/* ATTENDANCE HEALTH PULSE */}
          <AnimatePresence>
            {lowAttendance.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Card className="border-amber-500/20 bg-amber-500/5 glow-amber-sm">
                  <CardHeader className="py-3 flex flex-row items-center justify-between">
                     <CardTitle className="text-xs font-black text-amber-500 uppercase flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Attendance Priority Alert
                     </CardTitle>
                     <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">{lowAttendance.length} Subjects critical</Badge>
                  </CardHeader>
                  <CardContent className="pb-4 pt-0">
                     <p className="text-xs text-amber-500/80 font-bold mb-3">The following subjects require attention to stay above 75%:</p>
                     <div className="flex flex-wrap gap-2">
                        {lowAttendance.slice(0, 3).map(a => (
                           <button 
                             key={a.id} 
                             onClick={() => router.push('/dashboard/attendance')}
                             className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3 group transition-all hover:bg-amber-500/20"
                           >
                              <span className="text-xs font-black text-foreground">{a.subject_name.split(' ')[0]}</span>
                              <span className="text-xs font-black text-amber-500 px-1.5 py-0.5 rounded-lg bg-black/20 group-hover:bg-black/40">{a.percentage}%</span>
                           </button>
                        ))}
                     </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* QUICK ACTIONS HUB */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {[
               { name: 'CULKO Portal', icon: GraduationCap, color: 'text-blue-500', href: '/dashboard/academics' },
               { name: 'Campus AI', icon: Zap, color: 'text-primary', href: '/dashboard/chat' },
               { name: 'Maintenance', icon: SettingsIcon, color: 'text-orange-500', href: '/dashboard/hostel' },
               { name: 'Library Search', icon: BookOpen, color: 'text-purple-500', href: '/dashboard/library' }
             ].map((action, i) => (
                <motion.button
                  key={action.name}
                  whileHover={{ y: -4, scale: 1.02 }}
                  onClick={() => router.push(action.href)}
                  className="glass-panel p-4 rounded-3xl border-black/5 dark:border-white/5 flex flex-col items-center justify-center gap-3 transition-all hover:border-black/10 dark:border-white/10 group"
                >
                   <div className={`w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center group-hover:bg-black/10 dark:bg-white/10 transition-colors`}>
                      <action.icon className={`w-5 h-5 ${action.color}`} />
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">{action.name}</span>
                </motion.button>
             ))}
          </div>
        </div>

        {/* 3. NOTIFICATIONS (RIGHT COL) */}
        <div className="lg:col-span-4 space-y-6">
            <Card className="glass-panel h-full border-black/5 dark:border-black/5 dark:border-white/5 glow-olive-sm overflow-hidden flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-black/5 dark:border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/2">
                <div>
                  <CardTitle className="text-lg font-black text-foreground flex items-center gap-2">
                    <Bell className="w-4 h-4 text-primary" /> Notifications
                  </CardTitle>
                </div>
                {isSyncing && (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}>
                    <RefreshCw className="w-3 h-3 text-primary/50" />
                  </motion.div>
                )}
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-hidden">
                <div className="h-[450px] overflow-y-auto px-4 py-4 space-y-3 custom-scrollbar">
                  <AnimatePresence initial={false}>
                    {notifications.length > 0 ? (
                      notifications.slice(0, 8).map((notif) => (
                        <motion.div
                          key={notif.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={`p-3 rounded-2xl border border-black/5 dark:border-black/5 dark:border-white/5 relative group transition-all hover:bg-black/5 dark:hover:bg-black/5 dark:bg-white/5 ${notif.read ? 'opacity-60' : 'bg-primary/5'}`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="space-y-1">
                              <p className="font-black text-sm text-foreground leading-tight">{notif.title}</p>
                              <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{notif.message}</p>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between border-t border-black/5 dark:border-white/5 pt-2">
                             <span className="text-[9px] text-muted-foreground/60 uppercase font-black tracking-tight flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" /> {new Date(notif.created_at).toLocaleDateString()}
                             </span>
                             {notif.link ? (
                                <a href={notif.link} target="_blank" className="flex items-center gap-1 text-[9px] text-primary font-black uppercase hover:underline">
                                   DETAILS <ArrowRight className="w-2 h-2" />
                                </a>
                             ) : notif.title.includes('[Portal]') && (
                                <span className="flex items-center gap-1 text-[9px] text-primary/80 font-black uppercase tracking-tighter">
                                   <GraduationCap className="w-2.5 h-2.5" /> Portal
                                </span>
                             )}
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="py-32 text-center space-y-3 opacity-40">
                         <Bell className="w-12 h-12 mx-auto text-muted-foreground" />
                         <p className="text-xs font-black uppercase tracking-widest">{isSyncing ? 'Fetching Alerts...' : 'No new notifications'}</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </CardContent>
           </Card>
        </div>
      </div>

      <footer className="pt-8 text-center border-t border-black/5 dark:border-black/5 dark:border-white/5">
         <p className="text-[10px] text-muted-foreground/50 font-black uppercase tracking-[0.5em]">
            Campus Buddy Elite Engine • AI Augmented Dashboard
         </p>
      </footer>
    </div>
  )
}
