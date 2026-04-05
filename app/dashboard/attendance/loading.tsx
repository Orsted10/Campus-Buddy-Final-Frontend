import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { GraduationCap } from "lucide-react"

export default function AttendanceLoading() {
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-3 mb-8 border-b pb-6">
        <div className="p-3 bg-primary/10 rounded-xl">
          <GraduationCap className="w-8 h-8 text-primary" />
        </div>
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
      </div>

      <div className="grid gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="overflow-hidden border-border/50 bg-card/50">
            <CardHeader className="pb-3 bg-muted/20">
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex flex-col sm:row items-center gap-6 p-4 rounded-xl bg-muted/40 border border-border/50">
                <Skeleton className="w-24 h-24 rounded-full shrink-0" />
                <div className="w-full space-y-4">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
