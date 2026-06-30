'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell, Clock } from 'lucide-react'
import { usePortalStore } from '@/store/usePortalStore'

export default function NotificationsPage() {
  const notifications = usePortalStore((state) => state.notifications)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Notifications</h1>
        <p className="text-muted-foreground">Stay updated with campus activities</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Notifications</CardTitle>
          <CardDescription>Your recent updates and alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notifications.length > 0 ? (
              notifications.map((notif: any) => (
                <div key={notif.id} className={`flex items-start gap-4 p-4 rounded-lg transition-colors ${notif.read ? 'bg-muted/50' : 'bg-primary/10 border border-primary/20'}`}>
                  <Bell className="w-5 h-5 text-primary mt-1 shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(notif.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 opacity-50">
                <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p>No new notifications</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
