'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Info, 
  GraduationCap, 
  Palmtree, 
  Zap,
  ArrowRight,
  Clock,
  MapPin,
  User as UserIcon
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { ACADEMIC_CALENDAR_2026, CalendarEvent } from '@/lib/constants'
import { getISTDate } from '@/lib/utils-date'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const months = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
]

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const daysFullName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function AcademicCalendarPage() {
  const istNow = getISTDate()
  const [currentMonth, setCurrentMonth] = useState(3) // April (0-indexed)
  const [currentYear, setCurrentYear] = useState(2026)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [timetable, setTimetable] = useState<any>(null)

  useEffect(() => {
    setSelectedDate(istNow.toISOString().split('T')[0])
    fetchTimetable()
  }, [])

  const fetchTimetable = async () => {
    try {
      const res = await fetch('/api/culko?endpoint=timetable')
      const result = await res.json()
      if (result.success) setTimetable(result.data)
    } catch (err) {
      console.error('Failed to fetch timetable for calendar')
    }
  }

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const getEventForDate = (day: number) => {
    const d = day.toString().padStart(2, '0')
    const m = (currentMonth + 1).toString().padStart(2, '0')
    const dateStr = `${currentYear}-${m}-${d}`
    
    // 1. Check for explicit event
    const explicitEvent = ACADEMIC_CALENDAR_2026.find(e => e.date === dateStr)
    if (explicitEvent) return explicitEvent

    // 2. Fallback to default teaching days (Mon-Fri)
    const dateObj = new Date(currentYear, currentMonth, day)
    const dayOfWeekIdx = dateObj.getDay()
    if (dayOfWeekIdx >= 1 && dayOfWeekIdx <= 5) {
      return {
        date: dateStr,
        type: 'teaching' as const,
        event: 'Regular Teaching Day'
      }
    }

    return null
  }

  const selectedEvent = selectedDate ? getEventForDate(parseInt(selectedDate.split('-')[2])) : null
  
  // Get timetable for selected day
  const getSelectedTimetable = () => {
    if (!selectedDate || !timetable) return []
    const dateObj = new Date(selectedDate)
    const dayName = selectedEvent?.timetableOverride || daysFullName[dateObj.getDay()]
    return timetable[dayName] || []
  }

  const daySchedule = getSelectedTimetable()

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-6xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-primary mb-2"
          >
            <CalendarIcon className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-[0.2em]">Even Semester 2025-26</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black tracking-tight"
          >
            Academic <span className="text-gradient">Calendar</span>
          </motion.h1>
          <p className="text-muted-foreground text-sm flex items-center gap-2 mt-2">
            <Zap className="w-4 h-4 text-primary" />
            Live tracking of Teaching Days, Holidays, and Exams
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 glass px-6 py-3 rounded-2xl border-black/5 dark:border-white/5 text-[10px] font-black uppercase tracking-widest">
           <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> Teaching</div>
           <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" /> Holiday</div>
           <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" /> Exam</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Calendar Grid */}
        <Card className="lg:col-span-7 glass border-black/5 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <CardContent className="p-0">
             {/* Calendar Header */}
             <div className="p-8 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-white/[0.02]">
                <h2 className="text-2xl font-black text-foreground">{months[currentMonth]} {currentYear}</h2>
                <div className="flex items-center gap-2">
                   <button onClick={prevMonth} className="p-2 hover:bg-black/5 dark:bg-white/5 rounded-xl transition-colors"><ChevronLeft className="w-6 h-6" /></button>
                   <button onClick={nextMonth} className="p-2 hover:bg-black/5 dark:bg-white/5 rounded-xl transition-colors"><ChevronRight className="w-6 h-6" /></button>
                </div>
             </div>

             {/* Grid */}
             <div className="p-4 md:p-8">
                <div className="grid grid-cols-7 mb-4">
                   {daysOfWeek.map(day => (
                      <div key={day} className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground py-2">
                         {day}
                      </div>
                   ))}
                </div>

                <div className="grid grid-cols-7 gap-1 md:gap-3">
                   {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square" />
                   ))}

                   {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1
                      const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
                      const event = getEventForDate(day)
                      const isToday = istNow.toISOString().split('T')[0] === dateStr
                      const isSelected = selectedDate === dateStr

                      return (
                        <button
                          key={day}
                          onClick={() => setSelectedDate(dateStr)}
                          className={cn(
                            "aspect-square relative flex flex-col items-center justify-center rounded-2xl md:rounded-3xl border transition-all duration-300 group",
                            isSelected 
                              ? "bg-primary text-background border-primary glow-olive-sm z-10 scale-105" 
                              : isToday 
                                ? "bg-primary/10 border-primary/30 text-primary" 
                                : "hover:bg-black/5 dark:bg-white/5 border-transparent hover:border-black/10 dark:border-white/10 text-foreground/70 hover:text-foreground"
                          )}
                        >
                          <span className="text-base md:text-xl font-black tabular-nums">{day}</span>
                          
                          {/* Dot Markers */}
                          <div className="absolute bottom-2 md:bottom-4 flex gap-1">
                             {(event?.type === 'teaching' || event?.type === 'special') && <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-emerald-500 shadow-sm" />}
                             {event?.type === 'holiday' && <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-blue-500 shadow-sm" />}
                             {event?.type === 'exam' && <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-rose-500 shadow-sm" />}
                          </div>

                          {/* Saturday Override Badge */}
                          {event?.timetableOverride && (
                             <div className="absolute top-1 right-1 md:top-2 md:right-2">
                                <Zap className="w-2 h-2 md:w-3 md:h-3 text-emerald-500 animate-pulse" />
                             </div>
                          )}
                        </button>
                      )
                   })}
                </div>
             </div>
          </CardContent>
        </Card>

        {/* Selected Day Info */}
        <div className="lg:col-span-5 space-y-6">
           <AnimatePresence mode="wait">
             <motion.div
               key={selectedDate}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
             >
                <Card className="glass border-black/5 dark:border-white/5 rounded-[2.5rem] overflow-hidden">
                   <CardContent className="p-8 space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                           <h3 className="text-sm font-black text-primary uppercase tracking-[0.2em]">Selected Date</h3>
                           <p className="text-3xl font-black text-foreground">
                             {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long' }) : 'Select a date'}
                           </p>
                        </div>
                        {selectedEvent?.timetableOverride && (
                           <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                              <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest leading-none">Override</p>
                              <p className="text-xs font-bold text-foreground mt-1">{selectedEvent.timetableOverride}</p>
                           </div>
                        )}
                      </div>

                      <div className="h-px bg-black/5 dark:bg-white/5 w-full" />

                      {selectedEvent ? (
                        <div className="space-y-6">
                           {/* Status Header */}
                           <div className="flex items-start gap-4 p-4 rounded-3xl bg-white/[0.02] border border-black/5 dark:border-white/5">
                              <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border",
                                selectedEvent.type === 'teaching' && "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
                                selectedEvent.type === 'holiday' && "bg-blue-500/10 border-blue-500/20 text-blue-500",
                                selectedEvent.type === 'exam' && "bg-rose-500/10 border-rose-500/20 text-rose-500",
                                selectedEvent.type === 'special' && "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                              )}>
                                 {selectedEvent.type === 'teaching' && <GraduationCap className="w-6 h-6" />}
                                 {selectedEvent.type === 'holiday' && <Palmtree className="w-6 h-6" />}
                                 {selectedEvent.type === 'exam' && <Zap className="w-6 h-6" />}
                                 {selectedEvent.type === 'special' && <GraduationCap className="w-6 h-6" />}
                              </div>
                              <div>
                                 <h4 className="font-black text-foreground uppercase text-xs tracking-widest leading-none mb-1">Status</h4>
                                 <p className="text-lg font-bold text-foreground/90">
                                   {selectedEvent.type === 'teaching' && 'Normal Teaching Day'}
                                   {selectedEvent.type === 'holiday' && 'Public Holiday'}
                                   {selectedEvent.type === 'exam' && 'Examination Period'}
                                   {selectedEvent.type === 'special' && 'Special Working Day'}
                                 </p>
                              </div>
                           </div>

                           {/* Daily Timetable Integration */}
                           {(selectedEvent.type === 'teaching' || selectedEvent.type === 'special') && (
                              <div className="space-y-4">
                                 <div className="flex items-center justify-between">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                       <Clock className="w-3 h-3" /> Daily Schedule
                                    </h4>
                                    <span className="text-[10px] font-black text-primary px-2 py-0.5 border border-primary/20 rounded bg-primary/5 uppercase tracking-widest">Live</span>
                                 </div>
                                 
                                 <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                                    {daySchedule.length > 0 ? (
                                       daySchedule.map((slot: any, idx: number) => (
                                          <div key={idx} className="glass p-4 rounded-2xl border-black/5 dark:border-white/5 space-y-2 group hover:border-primary/30 transition-all">
                                             <div className="flex items-center justify-between">
                                                <p className="text-sm font-black text-foreground group-hover:text-primary transition-colors">{slot.subject}</p>
                                                <p className="text-[10px] font-bold text-muted-foreground tabular-nums">{slot.time}</p>
                                             </div>
                                             <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                   <MapPin className="w-3 h-3 text-primary" /> BLOCK E
                                                </div>
                                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                   <UserIcon className="w-3 h-3 text-primary" /> Faculty
                                                </div>
                                             </div>
                                          </div>
                                       ))
                                    ) : (
                                       <div className="py-8 text-center glass rounded-2xl border-dashed border-black/10 dark:border-white/10 opacity-60">
                                          <p className="text-xs font-bold">No classes scheduled</p>
                                       </div>
                                    )}
                                 </div>
                              </div>
                           )}

                           {selectedEvent.type === 'holiday' && (
                              <div className="p-6 rounded-3xl bg-blue-500/5 border border-blue-500/10 text-center space-y-3">
                                 <Palmtree className="w-10 h-10 text-blue-500 mx-auto" />
                                 <div>
                                    <h5 className="text-foreground font-black">{selectedEvent.event}</h5>
                                    <p className="text-xs text-muted-foreground mt-1">Campus closed for academic holiday.</p>
                                 </div>
                              </div>
                           )}

                           <Link href="/dashboard/timetable" className="block">
                              <button className="w-full py-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-foreground font-black uppercase text-xs tracking-widest hover:bg-primary hover:text-background hover:border-primary transition-all flex items-center justify-center gap-2 group">
                                 Open Detailed Planner <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                              </button>
                           </Link>
                        </div>
                      ) : (
                        <div className="py-20 text-center space-y-4">
                           <Info className="w-12 h-12 text-muted-foreground/20 mx-auto" />
                           <p className="text-muted-foreground text-sm font-medium">No official details for this date.</p>
                        </div>
                      )}
                   </CardContent>
                </Card>
             </motion.div>
           </AnimatePresence>

           {/* Quick Action - Official PDF */}
           <a 
             href="https://drive.usercontent.google.com/uc?id=1gae5YSnDfqIumvy3an5TfdT2bhCJ_45l&export=download" 
             target="_blank" 
             rel="noopener noreferrer"
             className="block"
           >
              <Card className="glass border-black/5 dark:border-white/5 rounded-[2rem] overflow-hidden p-6 hover:bg-white/[0.03] transition-colors cursor-pointer group">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-background transition-all shrink-0">
                       <CalendarIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                       <h4 className="text-sm font-black text-foreground">Download PDF</h4>
                       <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Official Schedule</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                 </div>
              </Card>
           </a>
        </div>
      </div>
      
      <p className="text-[10px] text-center text-muted-foreground/30 mt-12 uppercase tracking-[0.3em] font-black">
        Campus Buddy Elite • Academic Planning System v2.1
      </p>
    </div>
  )
}
