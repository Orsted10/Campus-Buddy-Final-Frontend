import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar } from "lucide-react"

export default function TimetableLoading() {
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-3 mb-8 border-b pb-6">
        <div className="p-3 bg-primary/10 rounded-xl">
          <Calendar className="w-8 h-8 text-primary" />
        </div>
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex gap-2 overflow-x-auto pb-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-10 w-24 rounded-lg shrink-0" />
          ))}
        </div>

        <div className="relative border-l-2 border-primary/10 ml-4 py-2 pl-6 space-y-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="relative group">
              <div className="absolute -left-[31px] mt-2.5 w-4 h-4 rounded-full bg-background border-2 border-primary/20" />
              <Card className="border-border/50 bg-card/50">
                <CardHeader className="py-4">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-6 w-56" />
                    <Skeleton className="h-8 w-32 rounded-md" />
                  </div>
                </CardHeader>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
