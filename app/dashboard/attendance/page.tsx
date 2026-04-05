import { fetchCULKOData } from '@/lib/culko/scraper'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { AlertCircle, CheckCircle2, AlertTriangle, GraduationCap } from 'lucide-react'

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

export default async function AttendancePage() {
  const result = await fetchCULKOData('attendance')
  
  if (!result.success) {
    return (
      <div className="p-6 max-w-4xl mx-auto flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Portal Sync Required</h2>
        <p className="text-muted-foreground max-w-md">
          {result.error || "You need to sync your CULKO portal to view advanced attendance analytics and predictions."}
        </p>
      </div>
    )
  }

  const attendance = result.data || []
  const isCached = result.isCached
  const lastSync = result.updatedAt

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-3 mb-8 border-b pb-6">
        <div className="p-3 bg-primary/10 rounded-xl">
          <GraduationCap className="w-8 h-8 text-primary" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold tracking-tight">Attendance Analytics</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-muted-foreground">Real-time attendance predictions & safe-skip analysis</p>
            <span className="text-muted-foreground mx-1">•</span>
            {isCached ? (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[10px] font-medium text-amber-500">
                <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                Archived {lastSync ? `(${new Date(lastSync).toLocaleDateString()})` : ''}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-medium text-emerald-500">
                <div className="w-1 h-1 rounded-full bg-emerald-500" />
                Live
              </div>
            )}
          </div>
        </div>
      </div>

      {attendance.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            No attendance data found for this semester.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {attendance.map((subject: any, idx: number) => {
            const attended = parseInt(subject.attended) || 0
            const total = parseInt(subject.total) || 0
            const percentageRaw = parseFloat(subject.percentage?.replace('%', '')) || 
                                 (total > 0 ? (attended / total) * 100 : 0)
            
            return (
              <Card key={idx} className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3 bg-muted/20">
                  <CardTitle className="text-lg font-semibold">{subject.name}</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <AttendanceRing 
                    percentage={percentageRaw} 
                    attended={attended} 
                    total={total} 
                  />
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
