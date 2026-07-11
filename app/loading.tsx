import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-8" aria-label="Carregando conteúdo">
      <Skeleton className="h-44 w-full rounded-2xl" />
      <div className="grid overflow-hidden rounded-xl sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-none border-r border-background" />
        ))}
      </div>
      <div>
        <Skeleton className="mb-4 h-7 w-44" />
        <div className="grid gap-4 sm:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
        </div>
      </div>
    </div>
  )
}
