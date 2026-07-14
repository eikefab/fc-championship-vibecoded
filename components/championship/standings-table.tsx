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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
    <TooltipProvider>
      <div className="-mx-4 overflow-x-auto px-4">
      <Table className="min-w-[760px]">
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 z-20 w-12 bg-card text-center">
              #
            </TableHead>
            <TableHead className="sticky left-12 z-20 min-w-40 bg-card">
              Participante
            </TableHead>
            <TableHead className="text-center">P</TableHead>
            <TableHead className="text-center">J</TableHead>
            <TableHead className="text-center">V</TableHead>
            <TableHead className="text-center">E</TableHead>
            <TableHead className="text-center">D</TableHead>
            <TableHead className="text-center">GP</TableHead>
            <TableHead className="text-center">GC</TableHead>
            <TableHead className="text-center">SG</TableHead>
            <TableHead className="text-center">CA</TableHead>
            <TableHead className="text-center">CV</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {standings.map((entry) => {
            const isG4 = entry.position <= 4
            const rowBackground = entry.positionGuaranteed
              ? "bg-amber-100/80 hover:bg-amber-100"
              : entry.qualificationGuaranteed
                ? "bg-emerald-100/80 hover:bg-emerald-100"
                : isG4
                  ? "bg-qualification/60 hover:bg-qualification/80"
                  : undefined
            const stickyBackground = entry.positionGuaranteed
              ? "bg-amber-100"
              : entry.qualificationGuaranteed
                ? "bg-emerald-100"
                : isG4
                  ? "bg-[#e3ebff]"
                  : "bg-card"
            return (
              <TableRow key={entry.participantId} className={rowBackground}>
                <TableCell
                  className={`sticky left-0 z-10 text-center font-mono text-sm ${stickyBackground}`}
                >
                  {entry.requiresTiebreak && (
                    <span className="mr-1" title="Empate no corte">
                      ⚡
                    </span>
                  )}
                  {entry.position}
                </TableCell>
                <TableCell
                  className={`sticky left-12 z-10 font-semibold ${stickyBackground}`}
                >
                  {entry.participantName}
                  {entry.isLive ? (
                    <Badge
                      variant="outline"
                      className="ml-1.5 animate-pulse border-red-200 bg-red-50 px-1.5 text-[9px] font-bold text-red-600"
                    >
                      AO VIVO
                    </Badge>
                  ) : entry.provisional ? (
                    <Badge
                      variant="outline"
                      className="ml-1.5 border-transparent bg-white/70 px-1.5 text-[9px] font-medium text-muted-foreground"
                    >
                      provisório
                    </Badge>
                  ) : null}
                </TableCell>
                <TableCell className="text-center font-mono font-bold text-[#102a68] tabular-nums">
                  <span className="inline-flex items-center justify-center">
                    {entry.points}
                    {entry.walkoverLosses > 0 ? (
                      <Tooltip>
                        <TooltipTrigger className="ml-0.5 cursor-help text-xs font-bold text-[#8a4e00]">*</TooltipTrigger>
                        <TooltipContent>
                          Este jogador perdeu {entry.walkoverLosses} {entry.walkoverLosses === 1 ? "partida" : "partidas"} por W.O.
                        </TooltipContent>
                      </Tooltip>
                    ) : null}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  {entry.matchesPlayed}
                </TableCell>
                <TableCell className="text-center">{entry.wins}</TableCell>
                <TableCell className="text-center">{entry.draws}</TableCell>
                <TableCell className="text-center">{entry.losses}</TableCell>
                <TableCell className="text-center">
                  {entry.goalsScored}
                </TableCell>
                <TableCell className="text-center">
                  {entry.goalsConceded}
                </TableCell>
                <TableCell className="text-center">
                  {entry.goalDifference}
                </TableCell>
                <TableCell className="text-center">
                  {entry.yellowCards}
                </TableCell>
                <TableCell className="text-center">{entry.redCards}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      </div>
    </TooltipProvider>
  )
}
