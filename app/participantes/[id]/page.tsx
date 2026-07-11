export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import { getParticipantData } from "@/lib/championship/application/queries"
import { RosterTable } from "@/components/championship/roster-table"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { PageHeading } from "@/components/championship/page-heading"

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
    <div className="space-y-7">
      <PageHeading eyebrow="Participante" title={participant.name} description={`${participant.players.length} jogadores inscritos no campeonato.`} />

      <Card className="surface-shadow border-0 ring-1 ring-[#102a68]/10">
        <CardHeader className="pb-2">
          <h2 className="font-heading text-base font-bold uppercase tracking-wide text-[#102a68]">
            Elenco oficial
          </h2>
        </CardHeader>
        <CardContent>
          <RosterTable players={participant.players} />
        </CardContent>
      </Card>
    </div>
  )
}
