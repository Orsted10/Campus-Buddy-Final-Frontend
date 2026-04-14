'use client'

import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from './ThemeToggle'
import { NotificationBell } from './NotificationBell'
import { LogOut, Loader2, Sparkles } from 'lucide-react'
import { useState } from 'react'

export default function Topbar() {
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

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/5 px-4 md:px-6 py-2.5 md:py-4 md:mr-4 md:mt-4 lg:rounded-2xl transition-all shadow-sm bg-background/50 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center glow-olive-sm">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          
          <div className="flex flex-col">
            <h2 className="text-sm md:text-xl font-black text-white tracking-widest uppercase">
              Campus Buddy
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2">
          <NotificationBell />
          <ThemeToggle />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleLogout} 
            disabled={loggingOut}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 md:h-10 md:w-10 rounded-full"
          >
            {loggingOut ? (
              <Loader2 className="w-3.5 h-3.5 md:w-5 md:h-5 animate-spin" />
            ) : (
              <LogOut className="w-3.5 h-3.5 md:w-5 md:h-5" />
            )}
          </Button>
        </div>
      </div>
    </header>
  )
}
