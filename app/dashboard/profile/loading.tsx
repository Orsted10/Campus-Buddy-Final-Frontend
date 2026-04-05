import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Fingerprint } from "lucide-react"

export default function ProfileLoading() {
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-3 mb-8 border-b pb-6">
        <div className="p-3 bg-primary/10 rounded-xl">
          <Fingerprint className="w-8 h-8 text-primary" />
        </div>
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-card/80 backdrop-blur-xl h-full rounded-2xl w-full p-8 shadow-xl flex flex-col items-center text-center space-y-6">
            <Skeleton className="w-32 h-32 rounded-full" />
            <div className="space-y-2 w-full flex flex-col items-center">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-6 w-32 rounded-full" />
            </div>
            <div className="w-full h-[1px] bg-border/50 my-2" />
            <div className="w-full space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="p-4 rounded-md shrink-0" />
                  <div className="space-y-1 w-full">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-7 w-48 mb-4" />
          <div className="grid sm:grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="p-4 rounded-xl border border-border/50 bg-muted/40 flex items-start gap-3">
                <Skeleton className="mt-0.5 w-2 h-2 rounded-full shrink-0" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
