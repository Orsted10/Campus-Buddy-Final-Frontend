'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { usePortalStore } from '@/store/usePortalStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle2, AlertTriangle, GraduationCap, RefreshCw, Calendar, Clock, User, ChevronRight, X, TrendingUp, BookOpen } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getApiUrl } from '@/lib/api-config'
import { Badge } from '@/components/ui/badge'

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
    while (((attended) / (total + skips + 1)) >= 0.75) skips++
    message = skips > 0 ? `Safe Zone: You can skip next ${skips} classes.` : `Borderline! One absence drops you below 75%.`
  } else {
    let needed = 0
    while (((attended + needed) / (total + needed)) < 0.75) needed++
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
            <circle cx="44" cy="44" r={radius} stroke="currentColor" strokeWidth="7" fill="transparent" className="text-muted/60" />
            <circle cx="44" cy="44" r={radius} stroke="currentColor" strokeWidth="7" fill="transparent" 
              className={ringColor} strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s ease-out' }}
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 bg-black/70 backdrop-blur-md animate-in fade-in" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 25 }}
        className="w-full max-w-2xl max-h-[88vh] overflow-hidden rounded-2xl bg-background/95 backdrop-blur-xl border border-white/10 flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 border-b border-white/5 flex items-center justify-between sticky top-0 bg-background/90 backdrop-blur-md z-10">
          <div>
            <h2 className="text-lg font-black tracking-tight">{subjectName}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-[0.15em]">Class Record</span>
              {!isLoading && history.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-green-500">{presentCount}P</span>
                  <span className="text-[9px] font-bold text-red-500">{absentCount}A</span>
                </div>
              )}
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center gap-3">
              <RefreshCw className="w-7 h-7 text-primary animate-spin" />
              <p className="text-xs font-black text-muted-foreground/60 uppercase tracking-[0.15em] animate-pulse">Fetching records...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="py-20 text-center space-y-2">
              <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto" />
              <p className="text-sm font-bold text-muted-foreground/50">No detailed records found</p>
              <p className="text-[10px] text-muted-foreground/40">The portal may not have detailed history available for this subject.</p>
            </div>
          ) : (
            history.map((record, i) => {
              const s = record.status?.toLowerCase() || ''
              const isPresent = s.includes('present')
              const isAbsent = s.includes('absent')
              const isDL = s.includes('dl') || s.includes('duty') || s.includes('medical')
              
              let dotColor = 'bg-muted-foreground/40'
              let statusBg = 'bg-muted/50 text-muted-foreground'
              if (isPresent) { dotColor = 'bg-green-500'; statusBg = 'bg-green-500/10 text-green-500' }
              else if (isAbsent && isDL) { dotColor = 'bg-blue-500'; statusBg = 'bg-blue-500/10 text-blue-500' }
              else if (isAbsent) { dotColor = 'bg-red-500'; statusBg = 'bg-red-500/10 text-red-500' }

              return (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/20 hover:border-border/40 transition-colors group">
                  <div className={`w-2 h-2 rounded-full ${dotColor} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold">{record.date}</span>
                      <Badge variant="outline" className={`text-[7px] uppercase font-black px-1.5 py-0 ${statusBg} border-0`}>
                        {record.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[9px] text-muted-foreground/60 font-medium">
                      {record.type && <span>{record.type}</span>}
                      {record.time && <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{record.time}</span>}
                      {record.section && <span>Sec: {record.section}</span>}
                      {record.group && <span>Grp: {record.group}</span>}
                      {record.markedBy && record.markedBy !== 'System' && (
                        <span className="flex items-center gap-0.5"><User className="w-2.5 h-2.5" />{record.markedBy.split(' ').slice(0, 2).join(' ')}</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
        
        <div className="p-3 border-t border-white/5 bg-muted/10">
          <p className="text-[8px] font-bold text-muted-foreground/40 uppercase text-center tracking-[0.15em]">
            Data from university portal records
          </p>
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
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setHistory(data.data)
        setRecentDotsCache(prev => ({ ...prev, [subject.code]: data.data.slice(0, 6) }))
      }
    } catch (err) {
      console.error('Connection error loading history', err)
    } finally {
      setIsHistoryLoading(false)
    }
  }, [])

  // Calculate overall attendance
  let totalEligAttd = 0, totalEligDelv = 0
  attendance.forEach((s: any) => {
    totalEligAttd += parseInt(s.eligibleAttended) || parseInt(s.attended) || 0
    totalEligDelv += parseInt(s.eligibleDelivered) || parseInt(s.total) || 0
  })
  const overallPercentage = totalEligDelv > 0 ? (totalEligAttd / totalEligDelv) * 100 : 0

  const isDisconnected = portalStatus === 'no_session' || portalStatus === 'logout'

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
                        {totalEligAttd} / {totalEligDelv} classes
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] font-black uppercase text-muted-foreground/50 tracking-wider">{attendance.length} Subjects</div>
                  <div className="text-xs font-bold text-muted-foreground/40 mt-0.5">
                    {totalEligDelv - totalEligAttd} absent
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
              const attended = parseInt(subject.eligibleAttended) || parseInt(subject.attended) || 0
              const total = parseInt(subject.eligibleDelivered) || parseInt(subject.total) || 0
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
