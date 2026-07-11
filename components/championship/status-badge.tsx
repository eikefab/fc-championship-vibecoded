import { Badge } from "@/components/ui/badge"

const statusLabels: Record<string, string> = {
  PENDING: "Pendente",
  ONGOING: "Em andamento",
  COMPLETED: "Encerrada",
}

const statusStyles: Record<string, string> = {
  PENDING: "bg-muted text-muted-foreground",
  ONGOING: "bg-live text-live-foreground",
  COMPLETED: "bg-emerald-100 text-emerald-800",
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={`border-0 font-medium ${statusStyles[status] ?? ""}`}
    >
      {statusLabels[status] ?? status}
    </Badge>
  )
}
