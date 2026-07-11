import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

type Player = {
  id: string
  name: string
  team: string
  positions: string[]
  overall: number
}

export function RosterTable({ players }: { players: Player[] }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <Table className="min-w-[620px]">
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 z-20 w-12 bg-card text-center">#</TableHead>
            <TableHead className="sticky left-12 z-20 bg-card">Jogador</TableHead>
            <TableHead>Clube</TableHead>
            <TableHead>Posições</TableHead>
            <TableHead className="text-center">Geral</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((player, i) => (
            <TableRow key={player.id}>
              <TableCell className="sticky left-0 z-10 bg-card text-center font-mono text-muted-foreground">
                {i + 1}
              </TableCell>
              <TableCell className="sticky left-12 z-10 bg-card font-semibold text-[#102a68]">
                {player.name}
              </TableCell>
              <TableCell>{player.team}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {player.positions.map((position) => <Badge key={position} variant="secondary" className="px-1.5 text-[9px]">{position}</Badge>)}
                </div>
              </TableCell>
              <TableCell className="text-center">
                <span className="inline-grid size-8 place-items-center rounded-full bg-[#102a68] font-mono text-xs font-bold text-white">{player.overall}</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
