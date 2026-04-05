import { fetchCULKOData } from '@/lib/culko/scraper'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, User, Mail, Shield, BookOpen, Fingerprint, CalendarDays } from 'lucide-react'

export default async function ProfilePage() {
  const [profileResult, attendanceResult] = await Promise.all([
    fetchCULKOData('profile'),
    fetchCULKOData('attendance')
  ])
  
  if (!profileResult.success) {
    return (
      <div className="p-6 max-w-4xl mx-auto flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Portal Not Synced</h2>
        <p className="text-muted-foreground max-w-md">
          You need to sync your CULKO portal to view your academic student ID details.
        </p>
      </div>
    )
  }

  const profile = profileResult.data || {}
  const subjects = attendanceResult.success ? attendanceResult.data : []

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-3 mb-8 border-b pb-6">
        <div className="p-3 bg-primary/10 rounded-xl">
          <Fingerprint className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Identity</h1>
          <p className="text-muted-foreground mt-1">Your registered university credentials</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Glassmorphic ID Card */}
        <div className="lg:col-span-1">
          <div className="relative group overflow-hidden rounded-2xl p-[1px]">
            {/* Animated border gradient */}
            <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative bg-card/80 backdrop-blur-xl h-full rounded-2xl w-full p-8 shadow-xl flex flex-col items-center text-center space-y-6">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-muted flex items-center justify-center bg-gradient-to-tr from-primary/20 to-blue-600/20 shadow-inner">
                 <User className="w-16 h-16 text-primary" />
              </div>
              
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight">{profile.name}</h2>
                <div className="inline-flex items-center justify-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold tracking-wide">
                  <Shield className="w-3.5 h-3.5" />
                  {profile.uid}
                </div>
              </div>

              <div className="w-full h-[1px] bg-border/50 my-2" />

              <div className="w-full space-y-4">
                {profile.email !== 'Unknown' && (
                  <div className="flex items-center gap-3 text-left">
                    <div className="p-2 bg-muted rounded-md shrink-0">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs text-muted-foreground">University Email</p>
                      <p className="text-sm font-medium truncate">{profile.email}</p>
                    </div>
                  </div>
                )}
                
                {profile.semester !== 'Unknown' && (
                  <div className="flex items-center gap-3 text-left">
                    <div className="p-2 bg-muted rounded-md shrink-0">
                      <CalendarDays className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Current Semester</p>
                      <p className="text-sm font-medium">{profile.semester}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Registered Subjects List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Registered Courses ({subjects.length})
          </h3>
          
          {subjects.length === 0 ? (
            <Card className="border-dashed bg-transparent shadow-none">
              <CardContent className="py-12 text-center text-muted-foreground">
                No active courses populated for this semester.
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {subjects.map((sub: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl border border-border/50 bg-muted/40 hover:bg-muted transition-colors flex items-start gap-3">
                  <div className="mt-0.5 w-2 h-2 rounded-full bg-primary shrink-0" />
                  <p className="text-sm font-medium leading-snug">{sub.name}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
