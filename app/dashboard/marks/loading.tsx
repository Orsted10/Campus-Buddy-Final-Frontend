import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Trophy } from "lucide-react"

export default function MarksLoading() {
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-3 mb-8 border-b pb-6">
        <div className="p-3 bg-primary/10 rounded-xl">
          <Trophy className="w-8 h-8 text-primary" />
        </div>
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
      </div>

      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden border-border/50 bg-card/50">
            <CardHeader className="pb-3 bg-muted/20">
              <Skeleton className="h-6 w-56" />
            </CardHeader>
            <CardContent className="pt-4 p-0">
              <div className="divide-y divide-border/20">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="p-4 flex justify-between items-center bg-muted/40 transition-colors">
                    <Skeleton className="h-4 w-32" />
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
