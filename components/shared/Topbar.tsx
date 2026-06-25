'use client'

import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from './ThemeToggle'
import { NotificationBell } from './NotificationBell'
import { LogOut, Loader2, Sparkles, Menu } from 'lucide-react'
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
    <header className="sticky top-0 z-40 w-full glass border-b border-border/40 px-4 md:px-6 py-3 md:mt-4 lg:rounded-[1.25rem] transition-all shadow-premium-sm bg-background/80 backdrop-blur-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          
          <div className="flex flex-col">
            <h2 className="text-sm md:text-base font-bold text-foreground tracking-tight">
              Dashboard
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-1.5 md:gap-3">
          <NotificationBell />
          <div className="w-px h-5 bg-border/60 mx-1 hidden md:block"></div>
          <ThemeToggle />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleLogout} 
            disabled={loggingOut}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-9 w-9 rounded-full transition-colors"
          >
            {loggingOut ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </header>
  )
}
