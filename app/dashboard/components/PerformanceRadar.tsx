'use client'

import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts'
import { motion } from 'framer-motion'
import { TrendingUp, Zap, Target } from 'lucide-react'

export function PerformanceRadar({ attendance, marks = [] }: { attendance: any[], marks?: any[] }) {
  if (!attendance || attendance.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center flex-col gap-2 opacity-50">
         <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
         <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Generating Neural Map...</p>
      </div>
    )
  }

  // Process data for radar chart (Show ALL subjects)
  const data = attendance.map(subject => {
    const fullSubject = subject?.name || subject?.subject_name || 'Unknown'
    const shortSubject = fullSubject.split(' ')[0]
    const attendancePercentage = parseFloat(subject?.percentage || subject?.eligiblePercentage) || 0

    // Find corresponding marks
    const subjectMarks = marks.find(m => {
       const mName = m.subject || m.subject_name || ''
       return mName.toLowerCase() === fullSubject.toLowerCase() || mName.split(' ')[0].toLowerCase() === shortSubject.toLowerCase()
    })

    let marksPercentage = 0
    if (subjectMarks && subjectMarks.evaluations) {
       let totalObtained = 0
       let totalMax = 0
       subjectMarks.evaluations.forEach((ev: any) => {
         const obtained = parseFloat(ev.marks)
         const max = parseFloat(ev.grade)
         if (!isNaN(obtained) && !isNaN(max) && max > 0) {
           totalObtained += obtained
           totalMax += max
         }
       })
       if (totalMax > 0) {
         marksPercentage = (totalObtained / totalMax) * 100
       }
    }

    return {
      subject: shortSubject,
      fullSubject,
      attendance: attendancePercentage,
      marks: marksPercentage || 0,
      fullMark: 100,
    }
  })

  // Calculate averages
  const avgAtt = data.reduce((sum, item) => sum + item.attendance, 0) / data.length
  
  const subjectsWithMarks = data.filter(d => d.marks > 0)
  const avgMarks = subjectsWithMarks.length > 0 
    ? subjectsWithMarks.reduce((sum, item) => sum + item.marks, 0) / subjectsWithMarks.length 
    : 0

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const isLowAtt = data.attendance < 75
      const isLowMarks = data.marks > 0 && data.marks < 40
      
      return (
        <div className="bg-background/95 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl min-w-[200px]">
          <p className="text-[10px] font-black text-foreground uppercase tracking-widest mb-4 leading-tight">{data.fullSubject}</p>
          
          <div className="space-y-3">
             <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" /> 
                   Attendance
                </span>
                <span className={`text-sm font-black ${isLowAtt ? 'text-red-500' : 'text-green-500'}`}>{data.attendance.toFixed(1)}%</span>
             </div>

             <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" /> 
                   Academics
                </span>
                {data.marks > 0 ? (
                   <span className={`text-sm font-black ${isLowMarks ? 'text-amber-500' : 'text-blue-500'}`}>{data.marks.toFixed(1)}%</span>
                ) : (
                   <span className="text-[10px] font-bold text-muted-foreground uppercase bg-white/5 px-2 py-0.5 rounded-md">N/A</span>
                )}
             </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="relative w-full h-[350px] flex flex-col group">
      <div className="absolute top-0 right-0 flex flex-col items-end gap-2 z-10 p-2 pointer-events-none">
         <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-xl backdrop-blur-md shadow-lg transition-transform group-hover:scale-105">
           <Zap className="w-3.5 h-3.5 text-green-500 drop-shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
           <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">
              ATT AVG: {avgAtt.toFixed(1)}%
           </span>
         </div>
         {avgMarks > 0 && (
            <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-xl backdrop-blur-md shadow-lg transition-transform group-hover:scale-105"
            >
              <Target className="w-3.5 h-3.5 text-blue-500 drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]" />
              <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">
                 MRK AVG: {avgMarks.toFixed(1)}%
              </span>
            </motion.div>
         )}
      </div>

      <div className="w-full h-[300px] -mt-2">
        <ResponsiveContainer width="99%" height="99%" minWidth={1} minHeight={1}>
          <RadarChart cx="50%" cy="50%" outerRadius="65%" data={data}>
            <PolarGrid stroke="rgba(255,255,255,0.08)" gridType="polygon" />
            <PolarAngleAxis 
               dataKey="subject" 
               tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 900, textAnchor: 'middle', letterSpacing: '0.1em' }} 
            />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
            
            {/* Academics Radar */}
            <Radar
              name="Academics"
              dataKey="marks"
              stroke="#3b82f6"
              strokeWidth={3}
              fill="url(#colorMarks)"
              fillOpacity={1}
              activeDot={{ r: 5, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
            />
            
            {/* Attendance Radar */}
            <Radar
              name="Attendance"
              dataKey="attendance"
              stroke="#22c55e"
              strokeWidth={3}
              fill="url(#colorAtt)"
              fillOpacity={1}
              activeDot={{ r: 5, fill: '#22c55e', stroke: '#fff', strokeWidth: 2 }}
            />
            
            {/* Gradients */}
            <defs>
               <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
               </linearGradient>
               <linearGradient id="colorMarks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
               </linearGradient>
            </defs>
          </RadarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="text-center flex flex-col items-center px-6 pb-2">
         <div className="flex items-center justify-center gap-3 w-full">
           <div className="h-px bg-gradient-to-r from-transparent to-primary/30 flex-1" />
           <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.25em] flex items-center gap-1.5">
             <TrendingUp className="w-3.5 h-3.5 text-primary" /> Performance Radar
           </p>
           <div className="h-px bg-gradient-to-l from-transparent to-primary/30 flex-1" />
         </div>
      </div>
    </div>
  )
}
