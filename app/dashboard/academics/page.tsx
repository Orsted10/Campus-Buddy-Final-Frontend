'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, BookOpen, Clock } from 'lucide-react'
import CULKOConnectionManager from './culko-connection'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function AcademicsPage() {
  const features = [
    {
      title: 'Timetable',
      description: 'View your weekly class schedule',
      icon: Calendar,
      href: '/dashboard/timetable', // Pointing to the unified route
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
          const isAvailable = feature.href !== '#'
          
          return (
            <Link 
              key={index} 
              href={feature.href}
              className={cn("h-full", !isAvailable && "pointer-events-none")}
            >
              <Card className={cn(
                "transition-all h-full",
                isAvailable 
                  ? "hover:shadow-lg hover:border-primary/50 cursor-pointer" 
                  : "opacity-60 border-black/5 dark:border-white/5"
              )}>
                <CardHeader>
                  <Icon className={cn("w-10 h-10 mb-2", isAvailable ? "text-primary" : "text-muted-foreground")} />
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {isAvailable ? 'Click to view details' : 'Feature coming soon'}
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
