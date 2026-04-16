'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  AlertCircle,
  RefreshCw,
  ChevronRight,
  MapPin,
  User,
  LayoutGrid
} from 'lucide-react'
import { getApiUrl } from '@/lib/api-config'
import { Card, CardContent } from '@/components/ui/card'
import { getISTDate } from '@/lib/utils-date'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { ACADEMIC_CALENDAR_2026 } from '@/lib/constants'

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

interface TimeSlot {
  time: string
  subject: string
}

type TimetableData = Record<string, TimeSlot[]>

export default function TimetablePage() {
  const router = useRouter()
  const [selectedDay, setSelectedDay] = useState('')
  const [data, setData] = useState<TimetableData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTimetable = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(getApiUrl('/api/culko?endpoint=timetable'))
      const result = await res.json()
      
      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error || 'Failed to fetch timetable')
      }
    } catch (err) {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTimetable()
    
    // Set initial day based on IST (Full 7 days support)
    const istNow = getISTDate()
    const dayIndex = istNow.getUTCDay() // 0 is Sunday, 1 is Monday...
    
    // Check if today is a Special Saturday with an override
    const dateStr = istNow.toISOString().split('T')[0]
    const calendarEvent = ACADEMIC_CALENDAR_2026.find(e => e.date === dateStr)
    
    if (calendarEvent?.timetableOverride) {
      setSelectedDay(calendarEvent.timetableOverride)
      toast.info(`Today is a Special Saturday following ${calendarEvent.timetableOverride} schedule!`)
    } else {
      // Map 0 (Sun) to index 6, 1-6 (Mon-Sat) to index 0-5
      const dayName = days[dayIndex === 0 ? 6 : dayIndex - 1]
      setSelectedDay(dayName)
    }
  }, [])

  const currentIST = getISTDate()
  
  // Logic for Saturday/Sunday "No Class" states
  const daySchedule = data ? data[selectedDay] || [] : []

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-primary mb-2"
          >
            <Calendar className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-[0.2em]">Academic Schedule</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black tracking-tight"
          >
            Daily <span className="text-gradient">Timetable</span>
          </motion.h1>
          <p className="text-muted-foreground text-sm flex items-center gap-2 mt-2">
            <LayoutGrid className="w-4 h-4" />
            View your class flow synchronized with IST
          </p>
        </div>

        <div className="flex gap-2">
            <button 
              onClick={fetchTimetable}
              disabled={loading}
              className="glass p-3 rounded-2xl border-black/5 dark:border-white/5 hover:border-primary/30 text-muted-foreground hover:text-primary transition-all disabled:opacity-50"
            >
              <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
            </button>
        </div>
      </div>

      {/* Day Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide">
        {days.map((day) => {
          const isActive = selectedDay === day
          const isToday = days[currentIST.getUTCDay() - 1] === day
          
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={cn(
                "relative group flex flex-col items-center justify-center min-w-[100px] py-4 rounded-[2rem] transition-all border shrink-0",
                isActive 
                  ? "bg-primary text-background border-primary glow-olive-sm scale-110 z-10" 
                  : "glass border-black/5 dark:border-white/5 text-muted-foreground hover:border-black/10 dark:border-white/10 hover:text-foreground"
              )}
            >
              {isToday && !isActive && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background" />
              )}
              <span className="text-[10px] font-black uppercase tracking-tighter mb-1 opacity-70">
                Week Day
              </span>
              <span className="text-lg font-black">{day === 'Wednesday' ? 'Wed' : day.substring(0, 3)}</span>
            </button>
          )
        })}
      </div>

      {/* Content Area */}
      <div className="space-y-4">
        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 glass rounded-[2rem] animate-pulse border-black/5 dark:border-white/5" />
            ))}
          </div>
        ) : error ? (
          <Card className="glass border-destructive/20 bg-destructive/5 rounded-[2rem]">
            <CardContent className="p-12 text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
              <h3 className="text-xl font-bold text-foreground">Something went wrong</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">{error}</p>
              <button 
                onClick={() => router.push('/dashboard/academics')}
                className="text-primary font-bold underline"
              >
                Sync CULKO Portal
              </button>
            </CardContent>
          </Card>
        ) : daySchedule.length === 0 ? (
          <div className="py-20 text-center space-y-4 glass rounded-[2.5rem] border-black/5 dark:border-white/5">
             <BookOpen className="w-16 h-16 text-muted-foreground/20 mx-auto" />
             <div>
                <h3 className="text-xl font-bold text-foreground">No classes on {selectedDay}</h3>
                <p className="text-muted-foreground text-sm">Either it's a holiday or your data needs a sync.</p>
             </div>
          </div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {daySchedule.map((slot, idx) => (
                <motion.div
                  key={`${selectedDay}-${idx}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="glass group hover:bg-white/[0.03] transition-all border-black/5 dark:border-white/5 overflow-hidden">
                    <CardContent className="p-6 md:p-8 flex items-center gap-6">
                      {/* Time Block */}
                      <div className="flex flex-col items-center justify-center min-w-[100px] border-r border-black/5 dark:border-white/5 pr-6">
                        <span className="text-[10px] font-black uppercase text-primary tracking-widest mb-1">Time Slot</span>
                        <span className="text-sm font-black text-foreground tabular-nums text-center leading-tight">
                           {slot.time.replace(/\s+/g, '\n')}
                        </span>
                      </div>

                      {/* Info Block */}
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                           <div>
                              <h3 className="text-lg font-black text-foreground group-hover:text-primary transition-colors leading-tight">
                                {slot.subject}
                              </h3>
                              <div className="flex flex-wrap gap-4 mt-2">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                   <MapPin className="w-3.5 h-3.5 text-primary" />
                                   <span className="font-bold">BLOCK E</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                   <User className="w-3.5 h-3.5 text-primary" />
                                   <span className="font-bold">Faculty Assigned</span>
                                </div>
                              </div>
                           </div>
                           
                           <motion.button 
                             whileHover={{ scale: 1.1 }}
                             className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-black/10 dark:border-white/10"
                           >
                             <ChevronRight className="w-4 h-4 text-foreground" />
                           </motion.button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <p className="text-[10px] text-center text-muted-foreground/30 mt-12 uppercase tracking-[0.3em] font-black">
        Automatic Portal Syncing Active
      </p>
    </div>
  )
}
