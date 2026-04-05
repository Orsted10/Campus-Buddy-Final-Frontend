'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Navigation, Clock } from 'lucide-react'

export default function NavigationPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Campus Navigation</h1>
        <p className="text-muted-foreground">Find your way around campus</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Interactive Campus Map</CardTitle>
          <CardDescription>Explore campus locations and get directions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Map integration coming soon</p>
              <p className="text-sm text-muted-foreground">Leaflet.js + OpenStreetMap</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <Navigation className="w-8 h-8 text-primary mb-2" />
            <CardTitle>Get Directions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Turn-by-turn navigation across campus</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <MapPin className="w-8 h-8 text-primary mb-2" />
            <CardTitle>Search Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Find libraries, labs, classrooms & more</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Clock className="w-8 h-8 text-primary mb-2" />
            <CardTitle>Book Facilities</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Reserve study rooms and sports facilities</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
