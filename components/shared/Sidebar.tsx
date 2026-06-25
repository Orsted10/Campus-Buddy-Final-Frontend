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

interface SidebarProps {
  mobile?: boolean
}

export default function Sidebar({ mobile }: SidebarProps) {
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
    <aside className={cn(
      "w-[260px] flex flex-col relative z-20 transition-all",
      mobile 
        ? "w-full h-full bg-background/95 backdrop-blur-3xl" 
        : "hidden md:flex h-[calc(100vh-2rem)] m-4 rounded-[1.25rem] border border-border/50 glass shadow-premium-lg"
    )}>
      {/* Brand Header */}
      <div className="p-6 pb-4 relative z-10 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-premium-sm glow-primary-sm">
          <span className="text-white font-bold text-sm tracking-tighter">CB</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Campus Buddy
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto scrollbar-hide py-2 relative z-10">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link key={item.href} href={item.href} className="block relative focus:outline-none">
              <motion.div
                whileHover={{ backgroundColor: "var(--color-secondary)" }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative z-10 group',
                  isActive
                    ? 'text-foreground font-semibold'
                    : 'text-muted-foreground font-medium hover:text-foreground'
                )}
              >
                {/* Active Indicator Background */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabBackground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-secondary/80 border border-border/50 rounded-lg -z-10 shadow-premium-inner"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <Icon className={cn(
                  "w-[18px] h-[18px] transition-colors", 
                  isActive ? "text-primary" : "opacity-70 group-hover:opacity-100"
                )} />
                <span className="text-sm tracking-tight">{item.label}</span>
              </motion.div>
            </Link>
          )
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="p-4 mt-auto border-t border-border/40 relative z-10 bg-background/30 backdrop-blur-md rounded-b-[1.25rem]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0 shadow-premium-sm">
            <span className="text-foreground font-semibold text-sm">
              {user?.full_name?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <p className="text-sm font-semibold text-foreground truncate">{user?.full_name}</p>
            <p className="text-[11px] text-muted-foreground truncate uppercase tracking-widest font-medium mt-0.5">
              {user?.role?.replace('_', ' ')}
            </p>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
            title="Logout"
          >
            {loggingOut ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </aside>
  )
}

