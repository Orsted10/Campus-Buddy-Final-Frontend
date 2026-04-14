'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  MessageSquare, 
  Calendar, 
  User, 
  ArrowUpRight 
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Home', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'AI Chat', icon: MessageSquare, href: '/dashboard/chat' },
  { label: 'Sync', icon: ArrowUpRight, href: '/dashboard/academics' }, // Portal sync page
  { label: 'Hostel', icon: Calendar, href: '/dashboard/hostel' },
  { label: 'Profile', icon: User, href: '/dashboard/profile' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-white/10 z-[100] pb-safe">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          const Icon = item.icon

          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-300",
                isActive ? "text-primary scale-110" : "text-muted-foreground hover:text-white"
              )}
            >
              <div className={cn(
                "relative p-1.5 rounded-xl transition-all",
                isActive ? "bg-primary/10 glow-olive-sm" : ""
              )}>
                <Icon className={cn("w-5 h-5", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-tighter">
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
