'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { usePortalStore } from '@/store/usePortalStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle2, AlertTriangle, GraduationCap, RefreshCw, Calendar, Clock, User, ChevronRight, X, TrendingUp, BookOpen } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getApiUrl } from '@/lib/api-config'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

function AttendanceRing({ 
  percentage, attended, total, idl = "0", adl = "0", vdl = "0", ml = "0", onViewDetails, recentDots
}: { 
  percentage: number, attended: number, total: number,
  idl?: string, adl?: string, vdl?: string, ml?: string,
  onViewDetails?: () => void, recentDots?: { status: string }[]
}) {
  const isSafe = percentage >= 75
  const isBorderline = percentage >= 70 && percentage < 75
  
  let message = ''
  let statusColor = isSafe ? 'text-green-500' : 'text-red-500'
  let ringColor = isSafe ? 'stroke-green-500' : (isBorderline ? 'stroke-yellow-500' : 'stroke-red-500')
  
  if (isSafe) {
    let skips = 0
    // Use the exact percentage to reverse-engineer the effective attended
    // This perfectly matches the portal's logic even if they added bonus/leaves not parsed here
    const effectiveAttended = (percentage / 100) * total;
    while (((effectiveAttended) / (total + skips + 1)) >= 0.75) skips++
    message = skips > 0 ? `Safe Zone: You can skip next ${skips} classes.` : `Borderline! One absence drops you below 75%.`
  } else {
    let needed = 0
    const effectiveAttended = (percentage / 100) * total;
    while (((effectiveAttended + needed) / (total + needed)) < 0.75) needed++
    message = `Critical: Attend next ${needed} classes to reach 75%.`
  }

  const radius = 35
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="flex flex-col gap-4 p-4 rounded-xl bg-muted/30 border border-border/30">
      <div className="flex items-center gap-5">
        <div className="relative w-[88px] h-[88px] flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="44" cy="44" r={radius} stroke="currentColor" strokeWidth="7" fill="transparent" className="text-muted/20" />
            <circle cx="44" cy="44" r={radius} stroke="currentColor" strokeWidth="7" fill="transparent" 
              className={`${ringColor} transition-all duration-1000 ease-out drop-shadow-sm`} strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-sm font-black ${statusColor}`}>{percentage.toFixed(1)}%</span>
          </div>
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="text-[9px] font-black uppercase text-muted-foreground/70 tracking-[0.15em]">Attendance Status</div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[9px] text-muted-foreground/60 uppercase font-bold tracking-wider">Elig. Attd</span>
              <span className="text-lg font-black text-foreground leading-none">{attended}</span>
            </div>
            <div className="w-px h-8 bg-border/30" />
            <div className="flex flex-col">
              <span className="text-[9px] text-muted-foreground/60 uppercase font-bold tracking-wider">Elig. Delv</span>
              <span className="text-lg font-black text-foreground leading-none">{total}</span>
            </div>
            <div className="w-px h-8 bg-border/30" />
            <div className="flex flex-col">
              <span className="text-[9px] text-muted-foreground/60 uppercase font-bold tracking-wider">Absent</span>
              <span className="text-lg font-black text-foreground leading-none">{total - attended}</span>
            </div>
          </div>
        </div>
        
        <button onClick={onViewDetails}
          className="flex items-center gap-1 text-[9px] font-black uppercase text-primary hover:text-primary/80 transition-colors tracking-[0.15em] group self-start mt-1"
        >
          Details <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Recent Class Dots */}
      {recentDots && recentDots.length > 0 && (
        <div className="flex items-center gap-1.5 pt-1 border-t border-border/20">
          <span className="text-[8px] font-bold text-muted-foreground/50 uppercase tracking-wider mr-1">Recent:</span>
          {recentDots.slice(0, 6).map((dot, i) => {
            const s = dot.status.toLowerCase()
            const isP = s.includes('present')
            const isDL = s.includes('dl') || s.includes('duty') || s.includes('medical')
            const color = isP ? 'bg-green-500' : isDL ? 'bg-blue-500' : 'bg-red-500'
            return <div key={i} className={`w-2.5 h-2.5 rounded-full ${color} shadow-sm`} title={dot.status} />
          })}
        </div>
      )}
      
      <div className={`text-[10px] p-2.5 rounded-lg flex items-start gap-2 ${isSafe ? 'bg-green-500/8 text-green-600 dark:text-green-400' : 'bg-red-500/8 text-red-600 dark:text-red-400'}`}>
        {isSafe ? <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />}
        <p className="font-bold leading-tight uppercase tracking-tight">{message}</p>
      </div>

      {(parseInt(vdl) > 0 || parseInt(ml) > 0 || parseInt(idl) > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {parseInt(vdl) > 0 && <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20 text-[8px] px-1.5 py-0">VDL: {vdl}</Badge>}
          {parseInt(ml) > 0 && <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[8px] px-1.5 py-0">ML: {ml}</Badge>}
          {parseInt(idl) > 0 && <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20 text-[8px] px-1.5 py-0">IDL: {idl}</Badge>}
        </div>
      )}
    </div>
  )
}

function HistoryModal({ isOpen, onClose, subjectName, history, isLoading }: { 
  isOpen: boolean, onClose: () => void, subjectName: string, history: any[], isLoading: boolean 
}) {
  if (!isOpen) return null

  const presentCount = history.filter(r => r.status?.toLowerCase().includes('present')).length
  const absentCount = history.filter(r => r.status?.toLowerCase().includes('absent')).length

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      <motion.div 
        initial={{ y: 20, opacity: 0, scale: 0.95 }} 
        animate={{ y: 0, opacity: 1, scale: 1 }} 
        exit={{ y: 20, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-3xl bg-background border border-border/50 flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
         {/* HEADER */}
        <div className="p-6 md:p-8 border-b border-border/40 relative overflow-hidden bg-muted/10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="flex items-start justify-between relative z-10">
            <div className="pr-4 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary">
                 <BookOpen className="w-3.5 h-3.5" />
                 <span className="text-[10px] font-bold tracking-widest uppercase">Class Record</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground leading-tight">{subjectName}</h2>
              <div className="flex items-center gap-3 pt-1">
                 <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 shadow-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-xs font-bold tracking-wide">{presentCount} PRESENT</span>
                 </div>
                 <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 shadow-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-xs font-bold tracking-wide">{absentCount} ABSENT</span>
                 </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2.5 rounded-full bg-background border border-border/50 hover:bg-muted text-muted-foreground transition-colors shrink-0 shadow-sm">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* TIMELINE CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-0 custom-scrollbar relative bg-muted/5">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                 <RefreshCw className="w-7 h-7 text-primary animate-spin" />
              </div>
              <p className="text-sm font-semibold text-muted-foreground animate-pulse tracking-wide">Syncing records...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="py-24 text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4 border border-border/50 shadow-sm">
                 <Calendar className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <p className="text-lg font-bold text-foreground">No Classes Logged</p>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">The portal has not recorded any detailed attendance for this subject yet.</p>
            </div>
          ) : (
            <div className="relative before:absolute before:inset-0 before:left-[27px] md:before:left-[39px] before:w-px before:bg-border/60">
              {history.map((record, i) => {
                const s = (record.status || '').toLowerCase()
                
                const isPresent = s.includes('present') || s === 'p' || s.includes('vdl')
                const isAbsent = s.includes('absent') || s === 'a'
                const isDL = s.includes('dl') || s.includes('duty') || s.includes('medical') || s === 'l' || s === 'ml'
                
                let displayStatus = record.status || 'Unknown'
                // Title case it nicely if it's just 'present' or 'absent'
                if (displayStatus.toLowerCase() === 'present') displayStatus = 'Present'
                if (displayStatus.toLowerCase() === 'absent') displayStatus = 'Absent'
                
                let dotColor = 'bg-muted-foreground/30 border-muted-foreground/20'
                let dotGlow = ''
                let statusBadge = <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground shadow-sm">{displayStatus}</span>
                let cardHover = 'hover:bg-muted/40'

                if (isPresent) { 
                   dotColor = 'bg-green-500 border-green-500/20'
                   dotGlow = 'ring-4 ring-green-500/10'
                   statusBadge = <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 shadow-sm">{displayStatus}</span>
                   cardHover = 'hover:bg-green-500/[0.02] hover:border-green-500/30'
                } else if (isDL) { 
                   dotColor = 'bg-blue-500 border-blue-500/20'
                   dotGlow = 'ring-4 ring-blue-500/10'
                   statusBadge = <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-sm">{displayStatus}</span>
                   cardHover = 'hover:bg-blue-500/[0.02] hover:border-blue-500/30'
                } else if (isAbsent) { 
                   dotColor = 'bg-red-500 border-red-500/20'
                   dotGlow = 'ring-4 ring-red-500/10'
                   statusBadge = <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 shadow-sm">{displayStatus}</span>
                   cardHover = 'hover:bg-red-500/[0.02] hover:border-red-500/30'
                }

                return (
                  <div key={i} className="relative flex items-stretch gap-4 md:gap-6 group pb-6 last:pb-0">
                    {/* Linear Timeline Indicator */}
                    <div className="relative flex flex-col items-center justify-start pt-4 w-14 shrink-0">
                       <div className={`w-3.5 h-3.5 rounded-full border-2 bg-background z-10 transition-all duration-300 ${dotColor} ${dotGlow} group-hover:scale-125`} />
                    </div>

                    {/* Content Card */}
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-20px" }}
                      className={`flex-1 p-5 md:p-6 rounded-2xl border border-border/40 bg-background transition-all duration-300 shadow-sm hover:shadow-md ${cardHover}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                         <div className="flex flex-col gap-1.5">
                            <span className="text-base font-bold text-foreground tracking-tight">{record.date}</span>
                            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                               <Clock className="w-3.5 h-3.5 opacity-70" />
                               <span>{record.time || 'N/A'}</span>
                            </div>
                         </div>
                         <div className="shrink-0 self-start">{statusBadge}</div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-muted-foreground pt-4 border-t border-border/30">
                         {record.markedBy && record.markedBy !== 'System' && (
                           <div className="flex items-center gap-2" title="Marked By">
                              <User className="w-4 h-4 opacity-50" />
                              <span className="truncate max-w-[200px] font-medium text-xs">{record.markedBy}</span>
                           </div>
                         )}
                         
                         {(record.type || record.section || record.group) && (
                           <div className="flex items-center gap-2 ml-auto">
                              {record.type && <Badge variant="secondary" className="bg-muted/50 text-muted-foreground border-0 text-[10px] px-2 py-0.5 font-medium rounded-md tracking-wider">Type: {record.type}</Badge>}
                              {record.section && <Badge variant="secondary" className="bg-muted/50 text-muted-foreground border-0 text-[10px] px-2 py-0.5 font-medium rounded-md tracking-wider">Sec: {record.section}</Badge>}
                              {record.group && <Badge variant="secondary" className="bg-muted/50 text-muted-foreground border-0 text-[10px] px-2 py-0.5 font-medium rounded-md tracking-wider">Group {record.group}</Badge>}
                           </div>
                         )}
                      </div>
                    </motion.div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default function AttendancePage() {
  const router = useRouter()
  const { attendance, portalStatus, isSyncing, lastSync, syncAll } = usePortalStore()
  const [selectedSubject, setSelectedSubject] = useState<any | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [recentDotsCache, setRecentDotsCache] = useState<Record<string, any[]>>({})

  useEffect(() => {
    if (attendance.length === 0) syncAll()
  }, [])

  const fetchDetails = useCallback(async (subject: any) => {
    setSelectedSubject(subject)
    setIsModalOpen(true)
    setIsHistoryLoading(true)
    setHistory([])

    try {
      const chkParam = subject.chk ? `&chk=${encodeURIComponent(subject.chk)}` : ''
      const res = await fetch(getApiUrl(`/api/culko?endpoint=attendance-details&courseCode=${subject.code}${chkParam}`))
      const data = await res.json()
      
      // Check if backend sent debug logs instead of a straight array
      let historyData = data.data
      let debugLogs = null
      
      if (data.success && !Array.isArray(data.data) && data.data?.debug) {
        historyData = data.data.data
        debugLogs = data.data.debug
        console.warn('Backend sent debug logs:', debugLogs)
      }

      if (data.success && Array.isArray(historyData) && historyData.length > 0) {
        setHistory(historyData)
        setRecentDotsCache(prev => ({ ...prev, [subject.code]: historyData.slice(0, 6) }))
      } else if (debugLogs && debugLogs.length > 0) {
        toast.error('Scraper failed. Check console for logs.')
      } else if (!data.success) {
        toast.error(`Backend error: ${data.error || 'Unknown error'}`)
        console.error('Attendance Details Error:', data)
      }
    } catch (err) {
      console.error('Connection error loading history', err)
      toast.error(`Connection error: ${err}`)
    } finally {
      setIsHistoryLoading(false)
    }
  }, [])

  // Calculate overall attendance
  let totalEligAttd = 0, totalEligDelv = 0
  attendance.forEach((s: any) => {
    // Use parseFloat to handle fractional attendances (like 0.5 for half days) which CULKO sometimes uses
    totalEligAttd += parseFloat(s.eligibleAttended) || parseFloat(s.attended) || 0
    totalEligDelv += parseFloat(s.eligibleDelivered) || parseFloat(s.total) || 0
  })
  const overallPercentage = totalEligDelv > 0 ? (totalEligAttd / totalEligDelv) * 100 : 0

  const isDisconnected = portalStatus === 'no_session'

  if ((portalStatus === 'error' && attendance.length === 0) || (isDisconnected && attendance.length === 0)) {
    return (
      <div className="p-6 max-w-4xl mx-auto flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">{portalStatus === 'error' ? 'Portal Connection Error' : 'Portal Sync Required'}</h2>
        <p className="text-muted-foreground max-w-md">
          {portalStatus === 'error' ? 'Failed to connect to CULKO.' : 'Connect your portal to view attendance analytics.'}
        </p>
        <div className="flex gap-3">
          <button onClick={() => syncAll()} className="bg-primary text-background px-6 py-2.5 rounded-xl font-black uppercase text-xs hover:opacity-90 transition-all">
            {portalStatus === 'error' ? 'Retry' : 'Sync Now'}
          </button>
          <button onClick={() => router.push('/dashboard/academics')} className="bg-muted px-6 py-2.5 rounded-xl font-black uppercase text-xs hover:bg-muted/80 transition-all">
            Credentials
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl">
            <GraduationCap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-foreground tracking-tight">Attendance Analytics</h1>
            <p className="text-muted-foreground/60 text-[10px] md:text-xs">Real-time predictions & safe-skip analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lastSync && (
            <span className="hidden md:block text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider">
              {new Date(lastSync).toLocaleTimeString()}
            </span>
          )}
          <button onClick={() => syncAll()} disabled={isSyncing}
            className="w-9 h-9 rounded-xl bg-muted/50 border border-border/30 flex items-center justify-center hover:border-primary/30 transition-all group">
            <RefreshCw className={`w-4 h-4 text-primary ${isSyncing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
          </button>
        </div>
      </div>

      {/* Overall Attendance Summary */}
      {attendance.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="overflow-hidden border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-primary/5">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-primary/10">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-[0.15em]">Overall Attendance</div>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className={`text-2xl font-black ${overallPercentage >= 75 ? 'text-green-500' : 'text-red-500'}`}>
                        {overallPercentage.toFixed(1)}%
                      </span>
                      <span className="text-xs text-muted-foreground/50 font-bold">
                        {totalEligAttd % 1 !== 0 ? totalEligAttd.toFixed(1) : totalEligAttd} / {totalEligDelv % 1 !== 0 ? totalEligDelv.toFixed(1) : totalEligDelv} classes
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] font-black uppercase text-muted-foreground/50 tracking-wider">{attendance.length} Subjects</div>
                  <div className="text-xs font-bold text-muted-foreground/40 mt-0.5">
                    {(totalEligDelv - totalEligAttd) % 1 !== 0 ? (totalEligDelv - totalEligAttd).toFixed(1) : (totalEligDelv - totalEligAttd)} absent
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Subject Cards */}
      {attendance.length === 0 && !isSyncing ? (
        <Card className="border-dashed bg-transparent">
          <CardContent className="py-12 text-center text-muted-foreground">
            No attendance data. Syncing now...
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {attendance.map((subject: any, idx: number) => {
              // Parse using parseFloat so fractional class attendances aren't truncated
              const attended = parseFloat(subject.eligibleAttended) || parseFloat(subject.attended) || 0
              const total = parseFloat(subject.eligibleDelivered) || parseFloat(subject.total) || 0
              // USE PORTAL'S EXACT PERCENTAGE — only calculate if missing
              const portalPerc = parseFloat(String(subject.eligiblePercentage || subject.percentage || '0').replace('%', ''))
              const percentage = portalPerc > 0 ? portalPerc : (total > 0 ? (attended / total) * 100 : 0)
              
              return (
                <motion.div key={`${subject.name}-${idx}`} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
                  <Card className="overflow-hidden border-border/20 bg-card/50 backdrop-blur-sm hover:border-border/40 transition-all duration-300">
                    <CardHeader className="p-3.5 pb-2 border-b border-border/10">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm md:text-base font-black text-foreground line-clamp-1">{subject.name}</CardTitle>
                        <span className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-wider">{subject.code}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3.5 pt-3">
                      <AttendanceRing 
                        percentage={percentage} attended={attended} total={total} 
                        idl={subject.idl} adl={subject.adl} vdl={subject.vdl} ml={subject.medicalLeave}
                        onViewDetails={() => fetchDetails(subject)}
                        recentDots={recentDotsCache[subject.code]}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      <HistoryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} 
        subjectName={selectedSubject?.name || ''} history={history} isLoading={isHistoryLoading} />
    </div>
  )
}
