'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Utensils, 
  Clock, 
  ChevronRight, 
  Soup, 
  Zap, 
  Coffee, 
  Pizza,
  Info,
  CalendarDays
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useConfig } from '@/components/providers/ConfigProvider'
import { getISTDate, isBetweenTimings } from '@/lib/utils-date'
import { cn } from '@/lib/utils'

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function MessMenuPage() {
  const { messMenu: MESS_MENU } = useConfig()
  const [selectedDay, setSelectedDay] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    // Set initial day based on IST
    const istNow = getISTDate()
    const dayName = days[istNow.getUTCDay() === 0 ? 6 : istNow.getUTCDay() - 1]
    setSelectedDay(dayName)

    // Update clock every minute for live highlighting
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  const currentDayData = MESS_MENU.schedule.find(s => s.day === selectedDay) || MESS_MENU.schedule[0]
  const istNow = getISTDate()

  const meals = [
    { 
      id: 'breakfast', 
      name: 'Breakfast', 
      icon: Coffee, 
      items: currentDayData.breakfast, 
      time: MESS_MENU.timings.breakfast,
      color: 'from-orange-500/20 to-orange-500/5',
      accent: 'text-orange-500'
    },
    { 
      id: 'lunch', 
      name: 'Lunch', 
      icon: Soup, 
      items: currentDayData.lunch, 
      common: MESS_MENU.common.lunch,
      time: MESS_MENU.timings.lunch,
      color: 'from-blue-500/20 to-blue-500/5',
      accent: 'text-blue-500'
    },
    { 
      id: 'snacks', 
      name: 'Evening Snacks', 
      icon: Pizza, 
      items: currentDayData.snacks, 
      time: MESS_MENU.timings.snacks,
      color: 'from-purple-500/20 to-purple-500/5',
      accent: 'text-purple-500'
    },
    { 
      id: 'dinner', 
      name: 'Dinner', 
      icon: Utensils, 
      items: currentDayData.dinner, 
      common: MESS_MENU.common.dinner,
      time: MESS_MENU.timings.dinner,
      color: 'from-emerald-500/20 to-emerald-500/5',
      accent: 'text-emerald-500'
    },
  ]

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
            <Utensils className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-[0.2em]">Dining Hall</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black tracking-tight"
          >
            Daily <span className="text-gradient">Mess Menu</span>
          </motion.h1>
          <p className="text-muted-foreground text-sm flex items-center gap-2 mt-2">
            <CalendarDays className="w-4 h-4" />
            Live sync with Campus Cafeteria (April 2026)
          </p>
        </div>

        {/* IST Clock */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-strong px-6 py-4 rounded-3xl border-black/5 dark:border-white/5 flex flex-col items-center justify-center min-w-[160px] shadow-2xl"
        >
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Campus Time</span>
          <span className="text-2xl font-black text-foreground tabular-nums tracking-tighter">
            {istNow.getUTCHours().toString().padStart(2, '0')}:{istNow.getUTCMinutes().toString().padStart(2, '0')}
          </span>
          <div className="flex items-center gap-1.5 mt-1">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-black text-emerald-500 uppercase">IST Sync</span>
          </div>
        </motion.div>
      </div>

      {/* Day Selector (Google Calendar Style) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        {days.map((day) => {
          const isActive = selectedDay === day
          const isToday = days[istNow.getUTCDay() === 0 ? 6 : istNow.getUTCDay() - 1] === day
          
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={cn(
                "relative group flex flex-col items-center justify-center min-w-[90px] py-4 rounded-[2rem] transition-all border shrink-0",
                isActive 
                  ? "bg-primary text-background border-primary glow-olive-sm scale-110 z-10" 
                  : "glass border-black/5 dark:border-white/5 text-muted-foreground hover:border-black/10 dark:border-white/10 hover:text-foreground"
              )}
            >
              {isToday && !isActive && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background" />
              )}
              <span className="text-[10px] font-black uppercase tracking-tighter mb-1 opacity-70">
                {day.substring(0, 3)}
              </span>
              <span className="text-lg font-black">{day === 'Wednesday' ? 'Wed' : day.substring(0, 3)}</span>
              {isActive && (
                <motion.div 
                  layoutId="activeDay"
                  className="absolute inset-0 bg-primary rounded-[2rem] -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Meals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence mode="wait">
          {meals.map((meal, idx) => {
            const [start, end] = meal.time.split(' - ')
            const isLive = isBetweenTimings(istNow, start, end)
            const Icon = meal.icon
            
            return (
              <motion.div
                key={`${selectedDay}-${meal.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className={cn(
                  "glass h-full group hover:bg-white/[0.03] transition-all border-black/5 dark:border-white/5 overflow-hidden relative",
                  isLive && "border-primary/40 shadow-[0_0_40px_-15px_rgba(163,230,53,0.3)] ring-1 ring-primary/20"
                )}>
                  <div className={cn(
                    "absolute top-0 left-0 w-1 h-full bg-gradient-to-b",
                    meal.color.replace('from-', 'from-').replace('to-', 'to-')
                  )} />

                  <CardContent className="p-8">
                    <div className="flex items-start justify-between mb-8">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500",
                          isLive 
                            ? "bg-primary text-background border-primary scale-110 shadow-lg"
                            : "glass border-black/10 dark:border-white/10 text-muted-foreground group-hover:border-primary/30 group-hover:text-primary"
                        )}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-black text-foreground tracking-tight">{meal.name}</h3>
                            {isLive && (
                              <div className="flex items-center gap-1 bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                                <Zap className="w-2.5 h-2.5 text-primary fill-primary" />
                                <span className="text-[9px] font-black uppercase text-primary tracking-widest">LIVE NOW</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground mt-1">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            <span className="text-xs font-bold tabular-nums">{meal.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="p-5 rounded-3xl bg-black/20 border border-black/5 dark:border-white/5 relative overflow-hidden group/box hover:border-black/10 dark:border-white/10 transition-colors">
                        <div className="absolute top-0 right-0 p-3 opacity-10">
                           <Pizza className="w-12 h-12" />
                        </div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-3 ml-1">Today's Special</h4>
                        <p className="text-base text-foreground/90 font-bold leading-relaxed line-clamp-3">
                          {meal.items}
                        </p>
                      </div>

                      {meal.common && (
                        <div className="flex gap-4 p-4 rounded-2xl bg-white/[0.02] border border-black/5 dark:border-white/5">
                           <Info className="w-5 h-5 text-muted-foreground/30 shrink-0 mt-0.5" />
                           <div>
                              <h5 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Common Items</h5>
                              <p className="text-xs text-muted-foreground leading-snug">
                                {meal.common}
                              </p>
                           </div>
                        </div>
                      )}

                      <motion.button
                        whileHover={{ x: 5 }}
                        className="flex items-center gap-2 text-[10px] font-black tracking-widest text-primary uppercase group/btn"
                      >
                        VIBRANCY RATING
                        <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                      </motion.button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      <p className="text-[10px] text-center text-muted-foreground/40 mt-12 uppercase tracking-[0.3em] font-black">
        Campus Buddy Elite • Hostel Management System v2.0
      </p>
    </div>
  )
}
