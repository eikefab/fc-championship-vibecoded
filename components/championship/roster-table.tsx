import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type Player = {
  id: string
  name: string
  team: string
  positions: string[]
  overall: number
}

export function RosterTable({ players }: { players: Player[] }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center">#</TableHead>
            <TableHead>Jogador</TableHead>
            <TableHead>Clube</TableHead>
            <TableHead>Posições</TableHead>
            <TableHead className="text-center">Geral</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((player, i) => (
            <TableRow key={player.id}>
              <TableCell className="text-center text-muted-foreground">
                {i + 1}
              </TableCell>
              <TableCell className="font-medium">
                {player.name}
              </TableCell>
              <TableCell>{player.team}</TableCell>
              <TableCell>
                <span className="text-xs">
                  {player.positions.join(", ")}
                </span>
              </TableCell>
              <TableCell className="text-center font-bold">
                {player.overall}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
