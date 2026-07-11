import { notFound } from "next/navigation"
import { getMatchData } from "@/lib/championship/application/queries"
import prisma from "@/lib/prisma"
import { MatchSheet } from "@/components/championship/match-sheet"
import { MatchControls } from "@/components/championship/match-controls"
import { EventForm } from "@/components/championship/event-form"

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
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Súmula</h1>
      <MatchSheet match={match} />
      <MatchControls
        matchId={match.id}
        status={match.status}
        homeScore={
          match.sides.find((s) => s.role === "HOME")?.score ?? null
        }
        awayScore={
          match.sides.find((s) => s.role === "AWAY")?.score ?? null
        }
      />
      {(match.status === "ONGOING" ||
        match.status === "COMPLETED") && (
        <EventForm
          matchId={match.id}
          players={playerOptions}
          events={events}
        />
      )}
    </div>
  )
}
