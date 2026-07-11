import { notFound } from "next/navigation"
import { getMatchData } from "@/lib/championship/application/queries"
import prisma from "@/lib/prisma"
import { MatchSheet } from "@/components/championship/match-sheet"
import { MatchControls } from "@/components/championship/match-controls"
import { EventForm } from "@/components/championship/event-form"
import { PageHeading } from "@/components/championship/page-heading"

export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const match = await getMatchData(id)

  if (!match) {
    notFound()
  }

  const players = await prisma.player.findMany({
    where: {
      participantId: {
        in: match.sides.map((s) => s.participantId),
      },
    },
    include: { participant: { select: { name: true } } },
  })

  const playerOptions = players.map((p) => ({
    id: p.id,
    name: p.name,
    participantId: p.participantId,
    participantName: p.participant.name,
  }))

  const events = match.events.map((e) => ({
    id: e.id,
    playerName: e.playerName,
    eventType: e.eventType,
    participantName:
      match.sides.find((s) => s.participantId === e.participantId)
        ?.participantName ?? "",
  }))

  return (
    <div className="space-y-7">
      <PageHeading eyebrow="Central da partida" title="Súmula" description="Atualize o placar e registre os acontecimentos da partida." />
      <MatchSheet match={match} />
      <div className={`grid items-start gap-6 ${match.status === "COMPLETED" ? "max-w-3xl" : "lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]"}`}>
        <MatchControls
          matchId={match.id}
          status={match.status}
          homeScore={match.sides.find((s) => s.role === "HOME")?.score ?? null}
          awayScore={match.sides.find((s) => s.role === "AWAY")?.score ?? null}
        />
        {(match.status === "ONGOING" || match.status === "COMPLETED") ? (
          <EventForm matchId={match.id} players={playerOptions} events={events} />
        ) : (
          <div className="rounded-xl border border-dashed bg-card/60 p-6 text-sm text-muted-foreground">
            Inicie a partida para registrar gols, assistências e cartões.
          </div>
        )}
      </div>
    </div>
  )
}
