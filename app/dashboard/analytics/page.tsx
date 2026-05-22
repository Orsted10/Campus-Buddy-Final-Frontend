'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  BrainCircuit, 
  TrendingUp, 
  Target, 
  AlertTriangle,
  ChevronRight,
  GraduationCap
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePortalStore } from '@/store/usePortalStore'

export default function AnalyticsPage() {
  const { marks } = usePortalStore()
  
  const [targetGPA, setTargetGPA] = useState(8.5)
  const [effortMultiplier, setEffortMultiplier] = useState(1.0)
  
  // Fake calculation based on available marks
  const currentAvg = marks && marks.length > 0 
    ? marks.reduce((acc, m) => acc + (parseFloat(m.percentage) || 0), 0) / marks.length 
    : 75.0 // Fallback if no marks

  // Predict SGPA
  // 90%+ = 10, 80%+ = 9, 70%+ = 8, 60%+ = 7
  const baseGPA = (currentAvg / 10) + 1.5 
  const predictedGPA = Math.min(10, Math.max(0, baseGPA * effortMultiplier))
  
  const difference = predictedGPA - targetGPA
  const isOnTrack = difference >= 0

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-5xl mx-auto pb-20">
      <div className="space-y-1">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 text-primary mb-2"
        >
          <BrainCircuit className="w-5 h-5" />
          <span className="text-xs font-black uppercase tracking-[0.2em]">Neural Engine v2.0</span>
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-5xl font-black tracking-tight"
        >
          AI <span className="text-gradient">Predictor</span>
        </motion.h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Card */}
        <Card className="glass-panel border-black/5 dark:border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-32 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-black">
              <Target className="w-5 h-5 text-primary" /> Goal Setting
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 relative z-10">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Target SGPA</label>
                <span className="text-2xl font-black text-primary">{targetGPA.toFixed(2)}</span>
              </div>
              <input 
                type="range" 
                min="5.0" max="10.0" step="0.1" 
                value={targetGPA}
                onChange={(e) => setTargetGPA(parseFloat(e.target.value))}
                className="w-full accent-primary h-2 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">End Sem Effort (Multiplier)</label>
                <span className="text-2xl font-black text-blue-500">{effortMultiplier.toFixed(1)}x</span>
              </div>
              <input 
                type="range" 
                min="0.5" max="1.5" step="0.1" 
                value={effortMultiplier}
                onChange={(e) => setEffortMultiplier(parseFloat(e.target.value))}
                className="w-full accent-blue-500 h-2 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                1.0x = Current Trajectory | 1.5x = God Mode Studying
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Output Card */}
        <Card className={`glass-panel border shadow-2xl relative overflow-hidden ${isOnTrack ? 'border-green-500/30' : 'border-red-500/30'}`}>
          <div className={`absolute top-0 right-0 p-32 blur-[100px] rounded-full pointer-events-none ${isOnTrack ? 'bg-green-500/10' : 'bg-red-500/10'}`} />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-black">
              <TrendingUp className={`w-5 h-5 ${isOnTrack ? 'text-green-500' : 'text-red-500'}`} /> 
              Neural Prediction
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 relative z-10 flex flex-col items-center justify-center h-[calc(100%-80px)]">
            <div className="text-center space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Predicted SGPA</span>
              <div className={`text-7xl font-black tracking-tighter ${isOnTrack ? 'text-green-500' : 'text-red-500'} drop-shadow-[0_0_15px_currentColor]`}>
                {predictedGPA.toFixed(2)}
              </div>
            </div>

            <div className={`flex items-center gap-2 p-3 rounded-xl border ${isOnTrack ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'}`}>
              {isOnTrack ? <GraduationCap className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
              <span className="text-xs font-bold uppercase tracking-wider">
                {isOnTrack 
                  ? `You are on track to beat your goal by +${difference.toFixed(2)} points!` 
                  : `Warning! You are ${Math.abs(difference).toFixed(2)} points below target.`}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
