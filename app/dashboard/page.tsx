'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, BookOpen, Building, Calendar, RefreshCw, Bell, ExternalLink, GraduationCap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function DashboardPage() {
  const user = useAuthStore((state: any) => state.user)
  const { notifications, setNotifications } = useNotificationStore()
  const [isSyncing, setIsSyncing] = useState(false)
  const [portalStatus, setPortalStatus] = useState<'connected' | 'no_session' | 'error' | null>(null)

  // 1. Initial Notification Fetch
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications')
        if (res.ok) {
          const data = await res.json()
          setNotifications(data)
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err)
      }
    }
    fetchNotifications()
  }, [setNotifications])

  // 2. Background Portal Sync (Announcements)
  useEffect(() => {
    const syncAnnouncements = async () => {
       try {
         setIsSyncing(true)
         const res = await fetch('/api/culko?endpoint=announcements')
         const data = await res.json()
         
         if (res.ok) {
            setPortalStatus('connected')
            // Re-fetch our database notifications after portal sync
            const notifRes = await fetch('/api/notifications')
            if (notifRes.ok) {
              const notifData = await notifRes.json()
              setNotifications(notifData)
            }
         } else {
            if (data.error?.includes('No active portal session')) {
               setPortalStatus('no_session')
            } else {
               setPortalStatus('error')
            }
         }
       } catch (err) {
         setPortalStatus('error')
         console.warn('Portal announcement sync failed:', err)
       } finally {
         setIsSyncing(false)
       }
    }
    
    // Tiny delay to let other things load
    const timer = setTimeout(syncAnnouncements, 2000)
    return () => clearTimeout(timer)
  }, [setNotifications])

  const stats = [
    { title: 'Active Assignments', value: '5', icon: BookOpen, color: 'text-blue-500' },
    { title: 'Hostel Requests', value: '2', icon: Building, color: 'text-green-500' },
    { title: 'Upcoming Events', value: '3', icon: Calendar, color: 'text-purple-500' },
    { title: 'Chat Sessions', value: '12', icon: MessageSquare, color: 'text-orange-500' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.full_name}!</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Frequently used features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <button className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors">
              <p className="font-medium">🤖 Ask Campus Buddy</p>
              <p className="text-sm text-muted-foreground">Get instant help with any query</p>
            </button>
            <button className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors">
              <p className="font-medium">📝 Raise Maintenance Request</p>
              <p className="text-sm text-muted-foreground">Report hostel issues quickly</p>
            </button>
            <button className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors">
              <p className="font-medium">📚 View Assignments</p>
              <p className="text-sm text-muted-foreground">Check upcoming deadlines</p>
            </button>
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/5 glow-olive-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-black text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" /> Recent Notifications
              </CardTitle>
              <CardDescription className="text-xs">Updates from portal & campus</CardDescription>
            </div>
            {isSyncing && (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}>
                <RefreshCw className="w-3 h-3 text-primary/50" />
              </motion.div>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              <AnimatePresence initial={false}>
                {notifications.length > 0 ? (
                  notifications.slice(0, 10).map((notif) => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-3 rounded-xl border border-white/5 relative group transition-all hover:bg-white/5 ${notif.read ? 'opacity-60' : 'bg-primary/5'}`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="space-y-1">
                          <p className="font-bold text-sm text-white leading-tight">{notif.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{notif.message}</p>
                        </div>
                        {notif.link && (
                          <a 
                            href={notif.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-white/5 text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                         <span className="text-[10px] text-muted-foreground/60 uppercase font-medium tracking-tight">
                            {new Date(notif.created_at).toLocaleDateString()}
                         </span>
                         {notif.title.includes('[Portal]') && (
                            <span className="flex items-center gap-1 text-[10px] text-primary/80 font-bold uppercase italic tracking-tighter">
                               <GraduationCap className="w-2.5 h-2.5" /> University Portal
                            </span>
                         )}
                      </div>
                    </motion.div>
                  ))
                ) : portalStatus === 'no_session' ? (
                  <div className="py-8 text-center space-y-4">
                     <div className="relative mx-auto w-12 h-12">
                        <Bell className="w-12 h-12 text-muted-foreground/20" />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-background flex items-center justify-center">
                           <span className="text-[8px] font-black text-white">!</span>
                        </div>
                     </div>
                     <div className="space-y-1">
                        <p className="text-sm font-bold text-white">Portal Not Connected</p>
                        <p className="text-xs text-muted-foreground px-4">Connect your CULKO account to receive university announcements.</p>
                     </div>
                     <button 
                        onClick={() => window.location.href = '/dashboard/academics'}
                        className="text-xs font-black text-primary px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-all border border-primary/20"
                     >
                        Connect Now
                     </button>
                  </div>
                ) : (
                  <div className="py-12 text-center space-y-2 opacity-40">
                     <Bell className="w-8 h-8 mx-auto text-muted-foreground" />
                     <p className="text-xs font-medium">{isSyncing ? 'Checking for updates...' : 'No new notifications'}</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
