'use client'

import { useAuthStore } from '@/store/useAuthStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, BookOpen, Building, Calendar } from 'lucide-react'

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user)

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

        <Card>
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
            <CardDescription>Latest updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium text-sm">Assignment Due Tomorrow</p>
                <p className="text-xs text-muted-foreground">Data Structures - Lab Assignment</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium text-sm">Maintenance Resolved</p>
                <p className="text-xs text-muted-foreground">Room 301 AC repair completed</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium text-sm">New Event</p>
                <p className="text-xs text-muted-foreground">Tech Fest 2024 registrations open</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
