import { fetchCULKOData } from '@/lib/culko/scraper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Calendar, Clock } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function TimetablePage() {
  const result = await fetchCULKOData('timetable')
  
  if (!result.success) {
    return (
      <div className="p-6 max-w-4xl mx-auto flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Portal Not Synced</h2>
        <p className="text-muted-foreground max-w-md">
          You need to sync your CULKO portal to view your daily schedule.
        </p>
      </div>
    )
  }

  const timetable = result.data || {}
  
  const standardDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const availableDays = Object.keys(timetable).filter((day: string) => timetable[day]?.length > 0)
  
  const currentDayIndex = new Date().getDay()
  const todayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDayIndex]
  const defaultTab = availableDays.includes(todayName) ? todayName : (availableDays[0] || 'Monday')

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-3 mb-8 border-b pb-6">
        <div className="p-3 bg-primary/10 rounded-xl">
          <Calendar className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Class Schedule</h1>
          <p className="text-muted-foreground mt-1">Your weekly academic timetable</p>
        </div>
      </div>

      {availableDays.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            No timetable data found. Either it's not uploaded yet or you have no classes.
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue={defaultTab} className="w-full flex flex-col">
          <TabsList className="w-full justify-start overflow-x-auto overflow-y-hidden p-1 bg-muted/50 h-auto mb-6 flex flex-row flex-wrap gap-2">
            {standardDays.map((day) => {
               if (!availableDays.includes(day)) return null
               return (
                 <TabsTrigger 
                   key={day} 
                   value={day}
                   className="px-6 py-2.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all flex-none h-auto"
                 >
                   {day}
                 </TabsTrigger>
               )
            })}
          </TabsList>

          {availableDays.map((day) => (
            <TabsContent key={day} value={day} className="space-y-4 outline-none focus:ring-0">
              <div className="relative border-l-2 border-primary/20 ml-4 py-2 pl-6 space-y-8">
                {timetable[day].map((cls: any, idx: number) => (
                  <div key={idx} className="relative group">
                    {/* Timeline dot */}
                    <div className="absolute -left-[31px] mt-1.5 w-4 h-4 rounded-full bg-background border-2 border-primary shadow-sm group-hover:scale-125 transition-transform" />
                    
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all">
                      <CardHeader className="py-4">
                         <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                           <CardTitle className="text-lg text-primary">{cls.subject}</CardTitle>
                           <span className="flex items-center gap-1.5 text-sm font-medium bg-muted/50 text-foreground px-3 py-1.5 rounded-md w-fit">
                             <Clock className="w-4 h-4 text-muted-foreground" />
                             {cls.time}
                           </span>
                         </div>
                      </CardHeader>
                    </Card>
                  </div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}
