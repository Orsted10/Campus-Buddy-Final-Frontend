'use client'

import { useEffect } from 'react'
import { usePortalStore } from '@/store/usePortalStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle2, AlertTriangle, GraduationCap, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Render prediction ring logic
function AttendanceRing({ percentage, attended, total }: { percentage: number, attended: number, total: number }) {
  const isSafe = percentage >= 75
  const isBorderline = percentage >= 70 && percentage < 75
  
  // Predict safe skips or needed classes
  let message = ''
  let statusColor = isSafe ? 'text-green-500' : 'text-red-500'
  let ringColor = isSafe ? 'stroke-green-500' : (isBorderline ? 'stroke-yellow-500' : 'stroke-red-500')
  
  if (isSafe) {
    let skips = 0
    while (((attended) / (total + skips + 1)) >= 0.75) skips++
    if (skips > 0) message = `Safe Zone: You can safely skip the next ${skips} class${skips > 1 ? 'es' : ''}.`
    else message = `Safe Zone: But skipping the next class drops you below 75%.`
  } else {
    let needed = 0
    while (((attended + needed) / (total + needed)) < 0.75) needed++
    message = `Critical: You need to attend the next ${needed} class${needed > 1 ? 'es' : ''} to reach 75%.`
  }

  const radius = 35
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-muted/40 border border-border/50">
      <div className="relative w-24 h-24 flex-shrink-0">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="48" cy="48" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-muted" />
          <circle 
            cx="48" cy="48" r={radius} 
            stroke="currentColor" strokeWidth="8" fill="transparent" 
            className={ringColor}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-base font-bold ${statusColor}`}>{percentage.toFixed(1)}%</span>
        </div>
      </div>
      
      <div className="w-full space-y-2 text-center sm:text-left">
        <div className="flex justify-between text-sm mb-1 px-1">
          <span className="text-muted-foreground">Attended: <strong className="text-foreground">{attended}</strong></span>
          <span className="text-muted-foreground">Total Delivered: <strong className="text-foreground">{total}</strong></span>
        </div>
        
        <div className={`text-sm p-3 rounded-lg flex items-start gap-2 ${isSafe ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
          {isSafe ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
          <p className="leading-tight">{message}</p>
        </div>
      </div>
    </div>
  )
}

export default function AttendancePage() {
  const { 
    attendance, 
    portalStatus, 
    isSyncing, 
    lastSync, 
    syncAll 
  } = usePortalStore()

  useEffect(() => {
    // Only auto-sync if we have no data or it's old
    if (attendance.length === 0) {
      syncAll()
    }
  }, [])
  
  if (portalStatus === 'error' && attendance.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Portal Connection Error</h2>
        <p className="text-muted-foreground max-w-md">
          Failed to connect to CULKO. Check your internet or portal credentials.
        </p>
        <button onClick={() => syncAll()} className="text-primary font-bold underline">Retry Sync</button>
      </div>
    )
  }

  if (portalStatus === 'no_session' && attendance.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Portal Sync Required</h2>
        <p className="text-muted-foreground max-w-md">
          You need to sync your CULKO portal to view advanced attendance analytics and predictions.
        </p>
        <a href="/dashboard/academics" className="text-primary font-bold underline">Connect now</a>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between border-b pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl">
            <GraduationCap className="w-8 h-8 text-primary" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold tracking-tight">Attendance Analytics</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-muted-foreground text-sm">Real-time attendance predictions & safe-skip analysis</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
           {lastSync && (
             <span className="hidden md:block text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest">
               Last Sync: {new Date(lastSync).toLocaleTimeString()}
             </span>
           )}
           <button 
             onClick={() => syncAll()} 
             disabled={isSyncing}
             className="w-10 h-10 rounded-xl glass border-white/5 flex items-center justify-center hover:border-primary/30 transition-all group"
           >
             <RefreshCw className={`w-4 h-4 text-primary ${isSyncing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
           </button>
        </div>
      </div>

      {attendance.length === 0 && !isSyncing ? (
        <Card className="border-dashed glass bg-transparent">
          <CardContent className="py-12 text-center text-muted-foreground">
            No attendance data found in local storage. Syncing now...
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          <AnimatePresence mode="popLayout">
            {attendance.map((subject: any, idx: number) => {
              const attended = parseInt(subject.attended) || 0
              const total = parseInt(subject.total) || 0
              const percentageRaw = parseFloat(subject.percentage?.replace('%', '')) || 
                                   (total > 0 ? (attended / total) * 100 : 0)
              
              return (
                <motion.div
                  key={subject.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="overflow-hidden border-white/5 glass shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3 border-b border-white/5">
                      <CardTitle className="text-lg font-black text-white">{subject.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <AttendanceRing 
                        percentage={percentageRaw} 
                        attended={attended} 
                        total={total} 
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
