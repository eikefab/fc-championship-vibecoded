import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { StandingEntryDto } from "@/lib/championship/domain"

export function StandingsTable({
  standings,
}: {
  standings: StandingEntryDto[]
}) {
  if (standings.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        Nenhuma partida registrada ainda.
      </p>
    )
  }

  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <Table className="min-w-[720px]">
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 z-20 w-12 bg-card text-center">#</TableHead>
            <TableHead className="sticky left-12 z-20 min-w-40 bg-card">Participante</TableHead>
            <TableHead className="text-center">P</TableHead>
            <TableHead className="text-center">V</TableHead>
            <TableHead className="text-center">E</TableHead>
            <TableHead className="text-center">D</TableHead>
            <TableHead className="text-center">GP</TableHead>
            <TableHead className="text-center">GC</TableHead>
            <TableHead className="text-center">CA</TableHead>
            <TableHead className="text-center">CV</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {standings.map((entry) => {
            const isG4 = entry.position <= 4
            return (
              <TableRow
                key={entry.participantId}
                className={isG4 ? "bg-qualification/60 hover:bg-qualification/80" : undefined}
              >
                <TableCell className={`sticky left-0 z-10 text-center font-mono text-sm ${isG4 ? "bg-[#e3ebff]" : "bg-card"}`}>
                  {entry.requiresTiebreak && (
                    <span className="mr-1" title="Empate no corte">
                      ⚡
                    </span>
                  )}
                  {entry.position}
                </TableCell>
                <TableCell className={`sticky left-12 z-10 font-semibold ${isG4 ? "bg-[#e3ebff]" : "bg-card"}`}>
                  {entry.participantName}
                  {entry.provisional && (
                    <Badge
                      variant="outline"
                      className="ml-1.5 border-transparent bg-white/70 px-1.5 text-[9px] font-medium text-muted-foreground"
                    >
                      provisório
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-center font-mono font-bold tabular-nums text-[#102a68]">
                  {entry.points}
                </TableCell>
                <TableCell className="text-center">
                  {entry.wins}
                </TableCell>
                <TableCell className="text-center">
                  {entry.draws}
                </TableCell>
                <TableCell className="text-center">
                  {entry.losses}
                </TableCell>
                <TableCell className="text-center">
                  {entry.goalsScored}
                </TableCell>
                <TableCell className="text-center">
                  {entry.goalsConceded}
                </TableCell>
                <TableCell className="text-center">
                  {entry.yellowCards}
                </TableCell>
                <TableCell className="text-center">
                  {entry.redCards}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
