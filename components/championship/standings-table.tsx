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
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center">#</TableHead>
            <TableHead>Participante</TableHead>
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
                className={
                  isG4 ? "bg-qualification/50" : undefined
                }
              >
                <TableCell className="text-center font-mono text-sm">
                  {entry.requiresTiebreak && (
                    <span className="mr-1" title="Empate no corte">
                      ⚡
                    </span>
                  )}
                  {entry.position}
                </TableCell>
                <TableCell className="font-medium">
                  {entry.participantName}
                  {entry.provisional && (
                    <Badge
                      variant="outline"
                      className="ml-2 border-live/40 text-live-foreground text-[10px]"
                    >
                      provisório
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-center font-bold">
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
