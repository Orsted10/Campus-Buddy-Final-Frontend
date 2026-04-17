'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePortalStore } from '@/store/usePortalStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { AlertCircle, CheckCircle2, AlertTriangle, GraduationCap, RefreshCw, Calendar, Clock, User, ChevronRight, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getApiUrl } from '@/lib/api-config'
import { Badge } from '@/components/ui/badge'

// Render prediction ring logic
function AttendanceRing({ 
  percentage, 
  attended, 
  total,
  idl = "0",
  adl = "0",
  vdl = "0",
  ml = "0",
  onViewDetails
}: { 
  percentage: number, 
  attended: number, 
  total: number,
  idl?: string,
  adl?: string,
  vdl?: string,
  ml?: string,
  onViewDetails?: () => void
}) {
  const isSafe = percentage >= 75
  const isBorderline = percentage >= 70 && percentage < 75
  
  // Predict safe skips or needed classes based on ELIGIBLE metrics
  let message = ''
  let statusColor = isSafe ? 'text-green-500' : 'text-red-500'
  let ringColor = isSafe ? 'stroke-green-500' : (isBorderline ? 'stroke-yellow-500' : 'stroke-red-500')
  
  if (isSafe) {
    let skips = 0
    // Skip calculation: If I stay home, Served delivered increases, but Attended stays same
    while (((attended) / (total + skips + 1)) >= 0.75) skips++
    if (skips > 0) message = `Safe Zone: You can skip next ${skips} classes (Portal Criteria).`
    else message = `Safe Zone: Don't skip! One absence drops you below 75%.`
  } else {
    let needed = 0
    // Needed calculation: If I attend, both Served and Attended increase
    while (((attended + needed) / (total + needed)) < 0.75) needed++
    message = `Critical: Attend next ${needed} classes to reach 75%.`
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
      
      <div className="w-full space-y-3 text-center sm:text-left">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
             <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-muted-foreground tracking-widest">Attendance Status</span>
             </div>
             <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Eligible Attd</span>
                  <span className="text-lg font-black text-foreground">{attended}</span>
                </div>
                <div className="w-px h-6 bg-border/50" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Eligible Delv</span>
                  <span className="text-lg font-black text-foreground">{total}</span>
                </div>
             </div>
          </div>
          
          <button 
            onClick={onViewDetails}
            className="flex items-center gap-1 text-[10px] font-black uppercase text-primary hover:text-primary/80 transition-colors tracking-widest group"
          >
            Details <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
        
        <div className={`text-xs p-3 rounded-xl flex items-start gap-2 ${isSafe ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
          {isSafe ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
          <p className="font-bold leading-tight uppercase tracking-tight">{message}</p>
        </div>

        {/* Duty Leave Pills */}
        {(parseInt(vdl) > 0 || parseInt(ml) > 0) && (
          <div className="flex flex-wrap gap-2 pt-1 border-t border-border/20">
             {parseInt(vdl) > 0 && <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20 text-[9px] px-2 py-0">VDL: {vdl}</Badge>}
             {parseInt(ml) > 0 && <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[9px] px-2 py-0">ML: {ml}</Badge>}
             {parseInt(idl) > 0 && <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20 text-[9px] px-2 py-0">IDL: {idl}</Badge>}
          </div>
        )}
      </div>
    </div>
  )
}

function HistoryModal({ 
  isOpen, 
  onClose, 
  subjectName, 
  history, 
  isLoading 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  subjectName: string, 
  history: any[], 
  isLoading: boolean 
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-3xl glass-panel border border-white/10 flex flex-col shadow-2xl"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-10">
          <div>
            <h2 className="text-xl font-black tracking-tight">{subjectName}</h2>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">Class Attendance Record</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <RefreshCw className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm font-black text-muted-foreground uppercase tracking-widest animate-pulse">Fetching records...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground font-bold italic uppercase tracking-widest">
              No detailed records found.
            </div>
          ) : (
            history.map((record, i) => {
              const isPresent = record.status.toLowerCase().includes('present')
              const isAbsent = record.status.toLowerCase().includes('absent')
              const isDL = record.status.toLowerCase().includes('dl') || record.type.toLowerCase().includes('vdl')
              
              let statusColor = 'bg-muted text-muted-foreground border-muted-foreground/20'
              if (isPresent) statusColor = 'bg-green-500/10 text-green-500 border-green-500/20'
              else if (isAbsent && isDL) statusColor = 'bg-orange-500/10 text-orange-500 border-orange-500/20'
              else if (isAbsent) statusColor = 'bg-red-500/10 text-red-500 border-red-500/20'

              return (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl glass-strong border border-white/5 group hover:border-white/10 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/5 flex flex-col items-center justify-center border border-primary/10">
                      <span className="text-[8px] font-black uppercase text-primary/60">{record.date.split('/')[1] || '---'}</span>
                      <span className="text-sm font-black text-primary">{record.date.split('/')[0] || '--'}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                         <span className="text-sm font-black">{record.date}</span>
                         <Badge variant="outline" className={`text-[8px] uppercase font-black px-2 py-0 ${statusColor}`}>
                            {record.status}
                         </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                          <Clock className="w-3 h-3" /> {record.time}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                          <User className="w-3 h-3" /> {record.markedBy}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {record.type}
                  </div>
                </div>
              )
            })
          )}
        </div>
        
        <div className="p-4 border-t border-white/5 bg-black/20">
           <p className="text-[9px] font-bold text-muted-foreground/60 uppercase text-center tracking-widest italic">
             Data synchronized from university portal records.
           </p>
        </div>
      </motion.div>
    </div>
  )
}

export default function AttendancePage() {
  const router = useRouter()
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
  
  const [selectedSubject, setSelectedSubject] = useState<any | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchDetails = async (subject: any) => {
    setSelectedSubject(subject)
    setIsModalOpen(true)
    setIsHistoryLoading(true)
    setHistory([])

    try {
      const res = await fetch(getApiUrl(`/api/culko?endpoint=attendance-details&courseCode=${subject.code}`))
      const data = await res.json()
      if (data.success) {
        setHistory(data.data)
      } else {
        toast.error('Failed to load class history')
      }
    } catch (err) {
      toast.error('Connection error')
    } finally {
      setIsHistoryLoading(false)
    }
  }

  const isDisconnected = portalStatus === 'no_session' || portalStatus === 'logout'
  if (portalStatus === 'error' && attendance.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold">Portal Connection Error</h2>
        <p className="text-muted-foreground max-w-md">
          Failed to connect to CULKO. Check your internet or portal credentials.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button 
            onClick={() => syncAll()} 
            className="w-full bg-primary text-background py-3 rounded-2xl font-black uppercase tracking-widest text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20"
          >
            Retry Sync
          </button>
          <button 
            onClick={() => router.push('/dashboard/academics')} 
            className="w-full bg-background border border-border py-3 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-muted transition-all"
          >
            Manage Credentials
          </button>
        </div>
      </div>
    )
  }

  if (isDisconnected && attendance.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Portal Sync Required</h2>
        <p className="text-muted-foreground max-w-md">
          You need to sync your CULKO portal to view advanced attendance analytics and predictions.
        </p>
        <button 
          onClick={() => router.push('/dashboard/academics')} 
          className="bg-primary text-background px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20"
        >
          Connect Now
        </button>
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
            <h1 className="text-xl md:text-3xl font-black text-foreground tracking-tight">Attendance Analytics</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-muted-foreground text-[10px] md:text-sm">Real-time attendance predictions & safe-skip analysis</p>
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
             className="w-10 h-10 rounded-xl glass border-black/5 dark:border-white/5 flex items-center justify-center hover:border-primary/30 transition-all group"
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <AnimatePresence>
            {attendance.map((subject: any, idx: number) => {
              const attended = parseInt(subject.attended) || 0
              const total = parseInt(subject.total) || 0
              const percentageRaw = parseFloat(subject.percentage?.replace('%', '')) || 
                                   (total > 0 ? (attended / total) * 100 : 0)
              
              return (
                <motion.div
                  key={`${subject.name}-${idx}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="overflow-hidden border-black/5 dark:border-white/5 glass shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="p-4 md:pb-3 border-b border-black/5 dark:border-white/5">
                      <CardTitle className="text-base md:text-lg font-black text-foreground line-clamp-1">{subject.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 md:pt-6">
                      <AttendanceRing 
                        percentage={percentageRaw} 
                        attended={parseInt(subject.eligibleAttended) || attended} 
                        total={parseInt(subject.eligibleDelivered) || total} 
                        idl={subject.idl}
                        adl={subject.adl}
                        vdl={subject.vdl}
                        ml={subject.medicalLeave}
                        onViewDetails={() => fetchDetails(subject)}
                      />
                      <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-1 items-center sm:items-start">
                        <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                          Debug: Core Value={total} | Eligible Value={subject.eligibleDelivered}
                        </span>
                        <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                          ID: {subject.code || 'NO_CODE'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      <HistoryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        subjectName={selectedSubject?.name || ''} 
        history={history} 
        isLoading={isHistoryLoading} 
      />
    </div>
  )
}
