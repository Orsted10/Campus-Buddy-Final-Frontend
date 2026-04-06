'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Wrench, Utensils, QrCode, WashingMachine } from 'lucide-react'
import Link from 'next/link'

export default function HostelPage() {
  const features = [
    {
      title: 'Maintenance Request',
      description: 'Report issues in your room or common areas',
      icon: Wrench,
      href: '#',
    },
    {
      title: 'Mess Menu',
      description: "View today's meal schedule and menu",
      icon: Utensils,
      href: '/dashboard/hostel/mess',
    },
    {
      title: 'Visitor Pass',
      description: 'Generate QR code passes for visitors',
      icon: QrCode,
      href: '#',
    },
    {
      title: 'Laundry Booking',
      description: 'Reserve laundry machines in advance',
      icon: WashingMachine,
      href: '#',
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Hostel Management</h1>
        <p className="text-muted-foreground">Manage your hostel services and requests</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {features.map((feature, index) => {
          const Icon = feature.icon
          const isAvailable = feature.href !== '#'
          
          return (
            <Link key={index} href={feature.href} className={!isAvailable ? 'pointer-events-none' : ''}>
              <Card className={`hover:shadow-lg transition-all cursor-pointer h-full ${!isAvailable ? 'opacity-60' : 'hover:border-primary/50 border-white/5'}`}>
                <CardHeader>
                  <Icon className={`w-10 h-10 mb-2 ${isAvailable ? 'text-primary' : 'text-muted-foreground'}`} />
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {isAvailable ? 'Click to access this feature' : 'Feature coming soon'}
                  </p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
