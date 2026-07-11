import { notFound } from "next/navigation"
import { getParticipantData } from "@/lib/championship/application/queries"
import { RosterTable } from "@/components/championship/roster-table"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default async function ParticipantPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const participant = await getParticipantData(id)

  if (!participant) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">
        {participant.name}
      </h1>

      <Card>
        <CardHeader className="pb-2">
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Elenco — {participant.players.length} jogadores
          </h2>
        </CardHeader>
        <CardContent>
          <RosterTable players={participant.players} />
        </CardContent>
      </Card>
    </div>
  )
}
