'use client'

import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from './ThemeToggle'
import { NotificationBell } from './NotificationBell'
import { LogOut, Menu, Loader2 } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useState } from 'react'
import Sidebar from './Sidebar'

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
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/5 px-4 md:px-6 py-3 md:py-4 md:mr-4 md:mt-4 lg:rounded-2xl transition-all shadow-sm bg-background/50 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-muted-foreground hover:text-foreground">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 bg-background border-r border-white/5">
              <Sidebar mobile={true} />
            </SheetContent>
          </Sheet>
          
          <div className="flex flex-col">
            <h2 className="text-base md:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60 truncate max-w-[150px] md:max-w-none">
              Welcome back!
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <NotificationBell />
          <ThemeToggle />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleLogout} 
            disabled={loggingOut}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-9 w-9 md:h-10 md:w-10"
          >
            {loggingOut ? (
              <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4 md:w-5 md:h-5" />
            )}
          </Button>
        </div>
      </div>
    </header>
  )
}
