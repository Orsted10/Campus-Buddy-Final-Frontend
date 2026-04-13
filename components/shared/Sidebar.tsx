'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import {
  Home,
  MessageSquare,
  Building,
  BookOpen,
  MapPin,
  Library,
  Bell,
  Settings,
  Shield,
  CheckSquare,
  Award,
  Calendar,
  User,
  LogOut,
  Loader2
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useState } from 'react'

const studentNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/dashboard/chat', label: 'AI Chatbot', icon: MessageSquare },
  { href: '/dashboard/hostel', label: 'Hostel', icon: Building },
  { href: '/dashboard/academics', label: 'Academics Portal', icon: BookOpen },
  { href: '/dashboard/attendance', label: 'Attendance', icon: CheckSquare },
  { href: '/dashboard/marks', label: 'Marks & Grades', icon: Award },
  { href: '/dashboard/timetable', label: 'Timetable', icon: Calendar },
  { href: '/dashboard/profile', label: 'Profile ID', icon: User },
  { href: '/dashboard/navigation', label: 'Navigation', icon: MapPin },
  { href: '/dashboard/library', label: 'Library', icon: Library },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
]

const adminNavItems = [
  ...studentNavItems,
  { href: '/dashboard/admin', label: 'Admin Panel', icon: Shield },
]

export default function Sidebar() {
  const pathname = usePathname()
  const user = useAuthStore((state) => state.user)
  const { signOut } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await signOut()
    } catch {
      setLoggingOut(false)
    }
  }

  const navItems = user?.role === 'admin' || user?.role === 'hostel_staff' 
    ? adminNavItems 
    : studentNavItems

  return (
    <aside className="w-64 glass-panel m-4 rounded-3xl hidden md:flex flex-col relative z-20 border-white/5 bg-background/30 shadow-2xl overflow-hidden before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-b before:from-white/[0.04] before:to-transparent">
      <div className="p-6 border-b border-white/5 relative">
        <h1 className="text-2xl font-black tracking-tighter text-gradient flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.5)]">
            <span className="text-white text-sm">CB</span>
          </div>
          Campus Buddy
        </h1>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link key={item.href} href={item.href} className="block relative focus:outline-none">
              <motion.div
                whileHover={{ x: 5, backgroundColor: "rgba(255,255,255,0.05)" }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative z-10',
                  isActive
                    ? 'text-foreground font-semibold'
                    : 'text-muted-foreground font-medium hover:text-foreground'
                )}
              >
                {/* Active Indicator Glow */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabGlow"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-primary/20 rounded-xl neon-glow -z-10"
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  />
                )}
                {/* Active Left Border Pill */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-full shadow-[0_0_10px_rgba(139,92,246,0.8)]"
                  />
                )}
                <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "opacity-70")} />
                <span>{item.label}</span>
              </motion.div>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-white/5 bg-foreground/[0.02]">
        <div className="flex items-center gap-2">
          <motion.div 
            whileHover={{ y: -2 }}
            className="flex-1 flex items-center gap-3 px-4 py-3 glass-panel rounded-2xl cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-purple-400 p-[2px] shadow-lg">
               <div className="w-full h-full bg-card rounded-full flex items-center justify-center">
                  <span className="text-foreground dark:text-white font-bold text-lg">
                    {user?.full_name?.charAt(0) || 'U'}
                  </span>
               </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{user?.full_name}</p>
              <p className="text-[10px] text-primary uppercase tracking-wider font-bold">{user?.role}</p>
            </div>
          </motion.div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="p-3 glass-panel rounded-2xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all disabled:opacity-50"
            title="Logout"
          >
            {loggingOut ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <LogOut className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </aside>
  )
}
