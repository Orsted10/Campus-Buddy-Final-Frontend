'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, FileText, BookOpen, Clock, Database } from 'lucide-react'
import CULKOConnectionManager from './culko-connection'

export default function AcademicsPage() {
  const features = [
    {
      title: 'Timetable',
      description: 'View your weekly class schedule',
      icon: Calendar,
    },
    {
      title: 'Assignments',
      description: 'Track deadlines and submissions',
      icon: FileText,
    },
    {
      title: 'Study Resources',
      description: 'Access lecture notes and materials',
      icon: BookOpen,
    },
    {
      title: 'Upcoming Deadlines',
      description: 'Never miss an important date',
      icon: Clock,
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
            <Card key={index}>
              <CardHeader>
                <Icon className="w-10 h-10 text-primary mb-2" />
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Feature coming soon</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
