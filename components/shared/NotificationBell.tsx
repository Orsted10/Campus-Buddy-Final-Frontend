'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Bell, Check, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { usePortalStore } from '@/store/usePortalStore'
import { cn } from '@/lib/utils'

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const notifications = usePortalStore((state) => state.notifications) || []
  const markNotificationRead = usePortalStore((state) => state.markNotificationRead)
  const clearNotifications = usePortalStore((state) => state.clearNotifications)

  const unreadCount = notifications.filter(n => !n.read).length

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={dropdownRef}>
      <Button 
        variant="ghost" 
        size="icon" 
        className={cn(
          "relative rounded-xl transition-colors",
          isOpen ? "bg-black/5 dark:bg-white/5 text-foreground" : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] animate-in zoom-in"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-h-[28rem] overflow-hidden rounded-2xl glass-strong border border-black/10 dark:border-white/10 shadow-2xl flex flex-col z-50 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between p-4 border-b border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]">
            <h3 className="font-bold text-sm">Notifications</h3>
            {notifications.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => clearNotifications()}
                className="h-8 text-xs text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Clear All
              </Button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-3 opacity-20" />
                No new notifications
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id}
                    className={cn(
                      "p-4 border-b border-black/5 dark:border-white/5 transition-colors text-sm last:border-0",
                      !notif.read ? "bg-primary/5" : "opacity-70 hover:opacity-100"
                    )}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1">
                        <p className={cn("font-medium", !notif.read && "text-primary")}>{notif.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-1.5 font-medium uppercase tracking-wider">
                          {new Date(notif.timestamp).toLocaleString(undefined, { 
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                          })}
                        </p>
                      </div>
                      {!notif.read && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 rounded-full shrink-0 text-primary hover:bg-primary/20"
                          onClick={() => markNotificationRead(notif.id)}
                          title="Mark as read"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
