import { fetchCULKOData } from '@/lib/culko/scraper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, User, Mail, Shield, BookOpen, Fingerprint, CalendarDays, HeartPulse, GraduationCap, MapPin, Users, Briefcase } from 'lucide-react'

export default function ProfilePage() {
  return <ProfileContent />
}

async function ProfileContent() {
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
        <h2 className="text-2xl font-bold">Portal Sync Required</h2>
        <p className="text-muted-foreground max-w-md">
          {profileResult.error || "You need to sync your CULKO portal to view your academic student ID details."}
        </p>
      </div>
    )
  }

  const profile = profileResult.data || {}
  const subjects = attendanceResult.success ? attendanceResult.data : []
  const isCached = profileResult.isCached || attendanceResult.isCached
  const lastSync = profileResult.updatedAt || attendanceResult.updatedAt


  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header Section */}
      <div className="flex items-center gap-3 mb-8 border-b pb-6">
        <div className="p-3 bg-primary/10 rounded-xl">
          <Fingerprint className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Identity</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-muted-foreground">Verified academic profile & university records</p>
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

      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Essential ID Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="relative group overflow-hidden rounded-3xl p-[2px]">
            {/* Pulsing glow background */}
            <span className="absolute inset-[-1000%] animate-[spin_5s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#A0D250_0%,#1A1C22_50%,#A0D250_100%)] opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
            
            <div className="relative bg-card/90 backdrop-blur-3xl rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center space-y-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20 flex items-center justify-center bg-gradient-to-tr from-primary/10 to-transparent p-1">
                   <div className="w-full h-full rounded-full bg-muted flex items-center justify-center">
                     <User className="w-16 h-16 text-primary/40" />
                   </div>
                </div>
                <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground p-1.5 rounded-full shadow-lg">
                  <Shield className="w-4 h-4" />
                </div>
              </div>
              
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight whitespace-nowrap">{profile.name}</h2>
                <div className="inline-flex items-center justify-center gap-1.5 bg-primary/10 text-primary px-4 py-1 rounded-full text-sm font-bold tracking-wider uppercase">
                  {profile.uid}
                </div>
              </div>

              <div className="w-full grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                <div className="text-center">
                   <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Semester</p>
                   <p className="text-lg font-bold text-primary">{profile.semester}</p>
                </div>
                <div className="text-center border-l border-border/50">
                   <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">CGPA</p>
                   <p className="text-lg font-bold text-cyber-green">✨ {profile.cgpa}</p>
                </div>
              </div>

              <div className="w-full grid grid-cols-2 gap-4 pt-2">
                <div className="text-center">
                   <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">SGPA</p>
                   <p className="text-sm font-bold opacity-80">{profile.sgpa}</p>
                </div>
                <div className="text-center border-l border-border/50">
                   <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Blood Group</p>
                   <p className="text-sm font-bold text-red-500">{profile.bloodGroup}</p>
                </div>
              </div>
            </div>
          </div>

          <Card className="border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden">
             <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                   <MapPin className="w-3.5 h-3.5" /> Permanent Address
                </CardTitle>
             </CardHeader>
             <CardContent>
                <p className="text-sm font-medium leading-relaxed">{profile.address || 'Address not listed'}</p>
             </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Detailed Records */}
        <div className="lg:col-span-8 space-y-8">
           
           {/* Section: Academic Context */}
           <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-border/50 bg-card/30 hover:bg-card/40 transition-colors group">
                 <CardContent className="pt-6 flex items-start gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-xl group-hover:scale-110 transition-transform">
                       <GraduationCap className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                       <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Program & Batch</p>
                       <p className="text-sm font-bold mt-1">{profile.program}</p>
                       <p className="text-xs text-muted-foreground mt-0.5">Admission Year: {profile.admissionYear}</p>
                    </div>
                 </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/30 hover:bg-card/40 transition-colors group">
                 <CardContent className="pt-6 flex items-start gap-4">
                    <div className="p-3 bg-purple-500/10 rounded-xl group-hover:scale-110 transition-transform">
                       <Mail className="w-6 h-6 text-purple-500" />
                    </div>
                    <div className="overflow-hidden">
                       <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">University Email</p>
                       <p className="text-sm font-bold mt-1 truncate">{profile.email}</p>
                       <p className="text-xs text-muted-foreground mt-0.5">Contact: {profile.mobile}</p>
                    </div>
                 </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/30 hover:bg-card/40 transition-colors group">
                 <CardContent className="pt-6 flex items-start gap-4">
                    <div className="p-3 bg-orange-500/10 rounded-xl group-hover:scale-110 transition-transform">
                       <Users className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                       <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Registrar Records</p>
                       <div className="mt-1 space-y-0.5">
                         <p className="text-sm font-bold">F: {profile.fathersName}</p>
                         <p className="text-sm font-bold">M: {profile.mothersName}</p>
                       </div>
                    </div>
                 </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/30 hover:bg-card/40 transition-colors group">
                 <CardContent className="pt-6 flex items-start gap-4">
                    <div className="p-3 bg-green-500/10 rounded-xl group-hover:scale-110 transition-transform">
                       <CalendarDays className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                       <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Date of Birth</p>
                       <p className="text-sm font-bold mt-1">{profile.dob}</p>
                       <p className="text-xs text-muted-foreground mt-0.5">Official Records ID</p>
                    </div>
                 </CardContent>
              </Card>
           </div>

           {/* Section: Courses */}
           <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Active Registration
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
                    <div key={idx} className="p-4 rounded-2xl border border-border/50 bg-muted/20 hover:bg-muted/40 hover:border-primary/20 transition-all flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary/40 shrink-0" />
                      <p className="text-sm font-semibold leading-tight">{sub.name}</p>
                    </div>
                  ))}
                </div>
              )}
           </div>
        </div>

      </div>
    </div>
  )
}
