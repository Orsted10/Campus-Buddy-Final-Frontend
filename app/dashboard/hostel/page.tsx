'use client'

import { usePortalStore } from '@/store/usePortalStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Wrench, Utensils, QrCode, WashingMachine, Building, MapPin, CalendarClock, ShieldCheck, Home, AlertCircle, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function HostelPage() {
  const { hostel, portalStatus, isSyncing, syncAll } = usePortalStore()

  const features = [
    {
      title: 'Maintenance Request',
      description: 'Report issues in your room or common areas',
      icon: Wrench,
      href: '#',
    },
    {
      title: 'Mess Menu',
      description: "View today's meal schedule and menu",
      icon: Utensils,
      href: '/dashboard/hostel/mess',
    },
    {
      title: 'Visitor Pass',
      description: 'Generate QR code passes for visitors',
      icon: QrCode,
      href: '#',
    },
    {
      title: 'Laundry Booking',
      description: 'Reserve laundry machines in advance',
      icon: WashingMachine,
      href: '#',
    },
  ]

  const hasHostel = hostel && hostel.status && hostel.room && !hostel.status.toLowerCase().includes('not allotted')

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tighter">Hostel Central</h1>
          <p className="text-muted-foreground mt-1">Manage your accommodation and services</p>
        </div>
        <button 
           onClick={() => syncAll()} 
           disabled={isSyncing}
           className="w-10 h-10 rounded-xl glass border-black/5 dark:border-white/5 flex items-center justify-center hover:border-primary/30 transition-all group"
         >
           <RefreshCw className={`w-4 h-4 text-primary ${isSyncing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
         </button>
      </div>

      {/* PORTAL SYNC STATES */}
      {portalStatus === 'no_session' || portalStatus === 'error' ? (
        <Card className="glass border-primary/20 bg-primary/5">
          <CardHeader className="text-center pb-2">
            <ShieldCheck className="w-12 h-12 text-primary mx-auto mb-2 opacity-80" />
            <CardTitle className="text-xl font-bold">Connect your portal</CardTitle>
            <CardDescription>Link your CULKO account to automatically sync your live room details and hostel status!</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pt-4">
            <Link href="/dashboard/academics" className="bg-primary text-primary-foreground font-bold px-6 py-2 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all hover:-translate-y-0.5">
              Sync Portal Now
            </Link>
          </CardContent>
        </Card>
      ) : isSyncing ? (
        <Card className="glass border-black/5 dark:border-white/5 flex flex-col items-center justify-center py-12">
          <RefreshCw className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground font-medium animate-pulse">Syncing live hostel data...</p>
        </Card>
      ) : portalStatus === 'connected' && !hasHostel ? (
        <Card className="glass border border-dashed border-muted-foreground/30 bg-muted/10">
          <CardContent className="flex flex-col items-center justify-center text-center py-16 space-y-4">
            <div className="w-20 h-20 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center">
              <Home className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">No Hostel Allotted</h3>
              <p className="text-muted-foreground max-w-md mt-2">
                According to the portal, you do not have an active hostel registration. If this is a mistake, please contact the warden.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : hasHostel ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid md:grid-cols-2 gap-6">
          <Card className="glass border-primary/20 shadow-xl shadow-primary/5 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10" />
            <CardHeader className="pb-4">
               <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-primary mb-1">Status: {hostel.status}</p>
                    <CardTitle className="text-2xl font-black">{hostel.name}</CardTitle>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                    <Building className="w-6 h-6 text-primary" />
                  </div>
               </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                 <div className="glass bg-black/5 dark:bg-white/5 rounded-xl p-4 border border-black/5 dark:border-white/5">
                   <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1 flex items-center gap-1.5"><MapPin className="w-3 h-3"/> Room No</p>
                   <p className="text-xl font-black text-foreground">{hostel.room}</p>
                 </div>
                 <div className="glass bg-black/5 dark:bg-white/5 rounded-xl p-4 border border-black/5 dark:border-white/5">
                   <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1 flex items-center gap-1.5"><Building className="w-3 h-3"/> Seating</p>
                   <p className="text-xl font-black text-foreground">{hostel.seater}</p>
                 </div>
              </div>
              {hostel.reportingStatus && (
                <div className="mt-4 flex items-center gap-2 text-xs font-medium text-muted-foreground bg-black/5 dark:bg-white/5 p-3 rounded-lg border border-black/5 dark:border-white/5">
                  <CalendarClock className="w-4 h-4 text-primary shrink-0" />
                  <span>{hostel.reportingStatus}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/2 hidden md:flex flex-col items-center justify-center p-6 text-center">
             <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 ring-8 ring-primary/5">
               <QrCode className="w-10 h-10 text-primary" />
             </div>
             <h3 className="font-bold text-lg mb-2">Digital Check-in</h3>
             <p className="text-muted-foreground text-sm max-w-[200px]">Use your barcode to scan into the mess and entry gates seamlessly.</p>
          </Card>
        </motion.div>
      ) : null}

      <div>
        <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-primary" /> Services & Utilities
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon
            const isAvailable = feature.href !== '#'
            
            return (
              <Link key={index} href={feature.href} className={!isAvailable ? 'pointer-events-none' : ''}>
                <Card className={`glass hover:shadow-lg transition-all cursor-pointer h-full border-black/5 dark:border-white/5 group ${!isAvailable ? 'opacity-50 grayscale' : 'hover:border-primary/50'}`}>
                  <CardHeader className="pb-3">
                    <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center mb-2 group-hover:bg-primary/10 transition-colors">
                      <Icon className={`w-5 h-5 ${isAvailable ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <CardTitle className="text-base">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-xs mb-3">{feature.description}</CardDescription>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-primary">
                      {isAvailable ? 'Access Module →' : 'Under Development'}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
