'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, BarChart3, Settings } from 'lucide-react'

export default function AdminPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage campus operations</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <Users className="w-8 h-8 text-primary mb-2" />
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Manage students and staff accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <BarChart3 className="w-8 h-8 text-primary mb-2" />
            <CardTitle>Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">View usage statistics and reports</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Settings className="w-8 h-8 text-primary mb-2" />
            <CardTitle>System Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Configure application settings</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
