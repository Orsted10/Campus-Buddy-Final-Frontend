'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, FileText, BookOpen, Clock } from 'lucide-react'
import CULKOConnectionManager from './culko-connection'
import Link from 'next/link'

export default function AcademicsPage() {
  const features = [
    {
      title: 'Timetable',
      description: 'View your weekly class schedule',
      icon: Calendar,
      href: '/dashboard/academics/timetable',
    },
    {
      title: 'Academic Calendar',
      description: 'Full semester schedule and holidays',
      icon: Clock,
      href: '/dashboard/academics/calendar',
    },
    {
      title: 'Study Resources',
      description: 'Access lecture notes and materials',
      icon: BookOpen,
      href: '#',
    },
    {
      title: 'Upcoming Deadlines',
      description: 'Never miss an important date',
      icon: Clock,
      href: '#',
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Academic Management</h1>
        <p className="text-muted-foreground">Stay on top of your studies</p>
      </div>

      {/* CULKO Integration */}
      <CULKOConnectionManager />

      <div className="grid gap-4 md:grid-cols-2">
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <Link key={index} href={feature.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <Icon className="w-10 h-10 text-primary mb-2" />
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {feature.href === '#' ? 'Feature coming soon' : 'Click to view details'}
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
