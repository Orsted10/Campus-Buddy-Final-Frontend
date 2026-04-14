'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, User, Mail, Shield, BookOpen, Fingerprint, CalendarDays, GraduationCap, MapPin, Users, Loader2 } from 'lucide-react'
import { getApiUrl } from '@/lib/api-config'
import { usePortalStore } from '@/store/usePortalStore'

export default function ProfilePage() {
  const router = useRouter()
  const { profile: cachedProfile, attendance: cachedAttendance, portalStatus, lastSync: storeLastSync } = usePortalStore()
  const [data, setData] = useState<any>(cachedProfile ? {
    profile: cachedProfile,
    subjects: cachedAttendance || [],
    isCached: portalStatus !== 'connected',
    lastSync: storeLastSync || new Date().toISOString()
  } : null)
  const [loading, setLoading] = useState(!cachedProfile)
  const [error, setError] = useState<string | null>(null)
  const [tapCount, setTapCount] = useState(0)

  useEffect(() => {
    // ... reset tap count after 3 seconds of inactivity
    const timer = setTimeout(() => setTapCount(0), 3000)
    return () => clearTimeout(timer)
  }, [tapCount])

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [pRes, aRes] = await Promise.all([
          fetch(getApiUrl('/api/culko?endpoint=profile')),
          fetch(getApiUrl('/api/culko?endpoint=attendance'))
        ])

        const pData = await pRes.json()
        const aData = await aRes.json()

        if (pData.success || aData.success) {
          setData((prev: any) => ({
            ...prev,
            profile: pData.data || prev?.profile || cachedProfile,
            subjects: aData.data || prev?.subjects || cachedAttendance,
            // Only show 'Archived' if the data actually came from cache AND portal is not live
            isCached: (pData.isCached === true) && portalStatus !== 'connected',
            lastSync: pData.updatedAt || aData.updatedAt || new Date().toISOString()
          }))
        } else if (!cachedProfile) {
          setError(pData.error || "Portal sync required")
        }
      } catch (err) {
        if (!cachedProfile) setError("Failed to load profile data")
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [cachedProfile, cachedAttendance])

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">Loading Student ID...</p>
      </div>
    )
  }

  if ((error || !data) && portalStatus !== 'connected') {
    return (
      <div className="p-6 max-w-4xl mx-auto flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Portal Sync Required</h2>
        <p className="text-muted-foreground max-w-md">
          {error || "You need to sync your CULKO portal to view your academic student ID details."}
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

  const { profile, subjects, isCached, lastSync } = data || { profile: cachedProfile, subjects: cachedAttendance || [], isCached: true }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 pb-20 pt-safe font-inter">
      {/* Header Section */}
      <div className="flex items-center gap-3 mb-8 border-b pb-6">
        <div 
          className="p-3 bg-primary/10 rounded-xl cursor-pointer active:scale-95 transition-transform"
          onClick={() => setTapCount(prev => prev + 1)}
        >
          <Fingerprint className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Identity</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-muted-foreground">Verified academic profile & records</p>
            {isCached && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[10px] font-medium text-amber-500">
                Archived {lastSync ? `(${new Date(lastSync).toLocaleDateString()})` : ''}
              </div>
            )}
            {tapCount >= 5 && profile?.email === '25lbcs3067@culkomail.in' && (
              <a href="/dashboard/admin" className="ml-2 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-[10px] font-black uppercase text-primary animate-in fade-in zoom-in duration-300">
                Admin Console
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Essential ID Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="relative group overflow-hidden rounded-3xl p-[2px]">
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
                <h2 className="text-2xl font-bold tracking-tight whitespace-nowrap">{profile?.name}</h2>
                <div className="inline-flex items-center justify-center gap-1.5 bg-primary/10 text-primary px-4 py-1 rounded-full text-sm font-bold tracking-wider uppercase">
                  {profile?.uid}
                </div>
              </div>

              <div className="w-full grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                <div className="text-center">
                   <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Semester</p>
                   <p className="text-lg font-bold text-primary">{profile?.semester}</p>
                </div>
                <div className="text-center border-l border-border/50">
                   <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">CGPA</p>
                   <p className="text-lg font-bold text-cyber-green">✨ {profile?.cgpa}</p>
                </div>
              </div>
            </div>
          </div>

          <Card className="border-border/50 bg-card/30 backdrop-blur-sm">
             <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                   <MapPin className="w-3.5 h-3.5" /> Permanent Address
                </CardTitle>
             </CardHeader>
             <CardContent>
                <p className="text-sm font-medium leading-relaxed">{profile?.address || 'Address not listed'}</p>
             </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Detailed Records */}
        <div className="lg:col-span-8 space-y-8">
           <div className="grid md:grid-cols-2 gap-6">
              {[
                { label: 'Program', value: profile?.program, icon: GraduationCap, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { label: 'University Email', value: profile?.email, icon: Mail, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                { label: 'Parents', value: `F: ${profile?.fathersName}
M: ${profile?.mothersName}`, icon: Users, color: 'text-orange-500', bg: 'bg-orange-500/10', stack: true },
                { label: 'Birth Date', value: profile?.dob, icon: CalendarDays, color: 'text-green-500', bg: 'bg-green-500/10' }
              ].map((item, i) => (
                <Card key={i} className="border-border/50 bg-card/30 hover:bg-card/40 transition-colors group">
                  <CardContent className="pt-6 flex items-start gap-4">
                    <div className={`p-3 ${item.bg} rounded-xl group-hover:scale-110 transition-transform`}>
                       <item.icon className={`w-6 h-6 ${item.color}`} />
                    </div>
                    <div className="overflow-hidden flex-1">
                       <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{item.label}</p>
                       <p className={`text-sm font-bold mt-1 ${item.stack ? 'whitespace-pre-line' : 'truncate'}`}>
                         {item.value}
                       </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
           </div>

           <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Active Registration
              </h3>
              {subjects?.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No active courses found.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {subjects?.map((sub: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-2xl border border-border/50 bg-muted/20 flex items-center gap-3">
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

