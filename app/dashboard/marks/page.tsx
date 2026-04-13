import { fetchCULKOData } from '@/lib/culko/scraper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Award, LayoutGrid, List } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export default async function MarksPage() {
  const result = await fetchCULKOData('marks')
  
  if (!result.success) {
    return (
      <div className="p-6 max-w-4xl mx-auto flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Portal Sync Required</h2>
        <p className="text-muted-foreground max-w-md">
          {result.error || "You need to sync your CULKO portal to view your structured marks and grades."}
        </p>
      </div>
    )
  }

  const subjects = result.data || []
  const isCached = result.isCached
  const lastSync = result.updatedAt

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 relative">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-10 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -z-10" />
      
      <div className="flex items-center gap-4 mb-10 border-b border-black/5 dark:border-white/5 pb-8">
        <div className="p-4 glass-panel rounded-2xl relative group">
          <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl group-hover:bg-primary/30 transition-all" />
          <Award className="w-8 h-8 text-primary relative z-10" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">Grades & Marks</h1>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-muted-foreground font-medium">Detailed evaluation breakdowns grouped by subject</p>
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

      {subjects.length === 0 ? (
        <Card className="glass-panel border-dashed border-black/10 dark:border-white/10">
          <CardContent className="py-16 text-center">
            <h3 className="text-xl font-bold text-foreground mb-2">No Data Available</h3>
            <p className="text-muted-foreground">No marks data found. Your results may not be published yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-6">
          {subjects.map((subject: any, idx: number) => {
            const evals = subject.evaluations || []
            
            // Calculate a quick summary if possible
            const scorable = evals.filter((e: any) => !isNaN(parseFloat(e.marks)) && !isNaN(parseFloat(e.grade)))
            let obtained = 0, total = 0
            scorable.forEach((e: any) => {
              obtained += parseFloat(e.marks)
              total += parseFloat(e.grade)
            })

            const percentage = total > 0 ? (obtained / total) * 100 : 0
            const glowColor = percentage >= 80 ? 'shadow-[0_0_15px_rgba(16,185,129,0.3)] border-emerald-500/20' 
                            : percentage >= 50 ? 'shadow-[0_0_15px_rgba(139,92,246,0.3)] border-primary/20' 
                            : 'shadow-[0_0_15px_rgba(239,68,68,0.3)] border-red-500/20'

            return (
              <AccordionItem 
                key={idx} 
                value={`item-${idx}`} 
                className={`glass-panel px-6 py-2 overflow-hidden transition-all duration-300 hover:bg-card/60 ${glowColor} rounded-2xl`}
              >
                <AccordionTrigger className="hover:no-underline py-5 text-left group">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full pr-4 gap-4">
                    <span className="font-bold text-xl text-foreground group-hover:text-primary transition-colors">{subject.subject}</span>
                    {total > 0 && (
                      <span className="text-sm font-bold bg-primary/5 dark:bg-background/50 border border-black/10 dark:border-white/10 text-foreground px-4 py-1.5 rounded-full backdrop-blur-md">
                        <span className={percentage >= 80 ? 'text-emerald-400' : percentage >= 50 ? 'text-primary' : 'text-red-400'}>
                          {obtained.toFixed(1)}
                        </span> 
                        <span className="text-muted-foreground mx-1">/</span> 
                        {total.toFixed(0)} scored
                      </span>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-6 pt-4 border-t border-black/5 dark:border-white/5">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {evals.map((evaluation: any, eIdx: number) => {
                      const isNumber = !isNaN(parseFloat(evaluation.marks))
                      const marksVal = parseFloat(evaluation.marks)
                      const maxVal = parseFloat(evaluation.grade)
                      const badgeColor = isNumber 
                        ? (marksVal / maxVal >= 0.8 ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' 
                          : (marksVal / maxVal >= 0.4 ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' 
                          : 'text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]'))
                        : 'text-foreground'

                      return (
                        <div key={eIdx} className="bg-background/40 border border-black/5 dark:border-white/5 rounded-xl p-4 flex justify-between items-center transition-all hover:bg-background/60 hover:-translate-y-1 hover:shadow-lg group">
                          <span className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors truncate mr-3" title={evaluation.type}>
                            {evaluation.type}
                          </span>
                          <div className="flex flex-col items-end shrink-0">
                            <span className={`text-xl font-black ${badgeColor}`}>
                              {evaluation.marks}
                            </span>
                            {evaluation.grade && (
                              <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mt-1">
                                MAX {evaluation.grade}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {evals.length === 0 && (
                    <div className="text-sm text-muted-foreground italic pl-2 bg-background/20 p-4 rounded-xl text-center">
                      No evaluations posted yet.
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      )}
    </div>
  )
}
