'use client'

import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts'
import { motion } from 'framer-motion'
import { TrendingUp, Zap } from 'lucide-react'

export function PerformanceRadar({ attendance }: { attendance: any[] }) {
  if (!attendance || attendance.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center flex-col gap-2 opacity-50">
         <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
         <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Generating Neural Map...</p>
      </div>
    )
  }

  // Process data for radar chart (Show ALL subjects)
  const data = attendance.map(subject => ({
    subject: (subject?.name || subject?.subject_name || 'Unknown').split(' ')[0], // Take only the first word/code
    fullSubject: subject?.name || subject?.subject_name || 'Unknown',
    percentage: parseFloat(subject?.percentage || subject?.eligiblePercentage) || 0,
    fullMark: 100,
  }))

  // Calculate average
  const avg = data.reduce((sum, item) => sum + item.percentage, 0) / data.length

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const isLow = data.percentage < 75
      return (
        <div className="bg-background/95 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-2xl">
          <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-wider mb-1">{data.fullSubject}</p>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-black ${isLow ? 'text-red-500' : 'text-primary'}`}>{data.percentage.toFixed(1)}%</span>
            {isLow && <span className="text-[8px] bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded font-bold uppercase">Critical</span>}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="relative w-full h-[350px] flex flex-col">
      <div className="absolute top-0 right-0 flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-xl z-10 backdrop-blur-md">
        <Zap className="w-3 h-3 text-primary" />
        <span className="text-[10px] font-black text-primary uppercase tracking-widest">
           AVG: {avg.toFixed(1)}%
        </span>
      </div>

      <div className="w-full h-[280px] -mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="65%" data={data}>
            <PolarGrid stroke="rgba(255,255,255,0.1)" />
            <PolarAngleAxis 
               dataKey="subject" 
               tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 900, textAnchor: 'middle' }} 
            />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Radar
              name="Attendance"
              dataKey="percentage"
              stroke="#22c55e"
              strokeWidth={2}
              fill="#22c55e"
              fillOpacity={0.2}
              activeDot={{ r: 4, fill: '#fff', stroke: '#22c55e', strokeWidth: 2 }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="text-center mt-2 flex flex-col items-center">
         <div className="flex items-center justify-center gap-2 w-full">
           <div className="h-px bg-gradient-to-r from-transparent to-primary/30 flex-1" />
           <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] flex items-center gap-1">
             <TrendingUp className="w-3 h-3" /> Performance Radar
           </p>
           <div className="h-px bg-gradient-to-l from-transparent to-primary/30 flex-1" />
         </div>
      </div>
    </div>
  )
}
