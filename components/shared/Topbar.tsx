'use client'

import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from './ThemeToggle'
import { NotificationBell } from './NotificationBell'
import { LogOut, Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import Sidebar from './Sidebar'

export default function Topbar() {
  const { signOut } = useAuth()

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/5 px-6 py-4 mr-4 mt-4 lg:rounded-2xl transition-all shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-muted-foreground hover:text-white">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 bg-transparent border-none shadow-none">
              <Sidebar />
            </SheetContent>
          </Sheet>
          
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            Welcome back!
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => signOut()} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
