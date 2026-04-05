'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Book, Search, Bookmark } from 'lucide-react'

export default function LibraryPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Library & Resources</h1>
        <p className="text-muted-foreground">Access books and digital resources</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <Search className="w-8 h-8 text-primary mb-2" />
            <CardTitle>Search Books</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Find books by title, author, or ISBN</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Bookmark className="w-8 h-8 text-primary mb-2" />
            <CardTitle>Reservations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Reserve books for pickup</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Book className="w-8 h-8 text-primary mb-2" />
            <CardTitle>Digital Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Access e-books and journals</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
