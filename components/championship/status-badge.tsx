import { Badge } from "@/components/ui/badge"

const statusLabels: Record<string, string> = {
  PENDING: "Pendente",
  ONGOING: "Em andamento",
  COMPLETED: "Encerrada",
}

const statusStyles: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-600",
  ONGOING: "bg-[#e9a23b]/20 text-[#8a4e00] ring-1 ring-[#e9a23b]/25",
  COMPLETED: "bg-[#16845b]/10 text-[#126b4b] ring-1 ring-[#16845b]/15",
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
