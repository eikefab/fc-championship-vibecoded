import "server-only"
import prisma from "@/lib/prisma"
import {
  generateRoundRobin,
  planTiebreak,
  calculateStandingsWithTiebreak,
} from "@/lib/championship/domain"
import type { ActionResult } from "./action-result"
import { success, failure } from "./action-result"

export async function createGroupTiebreak(
  groupId: string,
): Promise<ActionResult<{ tiebreakId: string; matchCount: number }>> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      memberships: { include: { participant: true } },
      matches: {
        where: { type: "REGULAR_GROUP" },
        include: {
          participants: true,
          events: true,
        },
      },
    },
  })

  if (!group) {
    return failure("NOT_FOUND", "Grupo não encontrado")
  }

  const pending = group.matches.filter(
    (m) => m.type === "REGULAR_GROUP" && m.status !== "COMPLETED",
  )
  if (pending.length > 0) {
    return failure(
      "STATE_CONFLICT",
      "Todas as 20 partidas regulares precisam estar concluídas",
    )
  }

  const participants = group.memberships.map((m) => ({
    id: m.participantId,
    name: m.participant.name,
  }))

  const matchesDto = group.matches.map((m) => ({
    id: m.id,
    type: m.type as "REGULAR_GROUP",
    status: m.status as "ONGOING" | "COMPLETED",
    groupCode: group.code as "A" | "B",
    round: m.round,
    knockoutStage: null as null,
    walkoverWinnerId: m.walkoverWinnerId,
    completedAt: m.completedAt?.toISOString() ?? null,
    sides: m.participants.map((mp) => ({
      participantId: mp.participantId,
      participantName: "",
      role: mp.role as "HOME" | "AWAY",
      score: mp.score as number | null,
      penaltyScore: mp.penaltyScore as number | null,
    })),
    events: m.events.map((e) => ({
      id: e.id,
      matchId: e.matchId,
      playerId: e.playerId,
      playerName: "",
      participantId: "",
      eventType: e.eventType as
        | "GOAL"
        | "ASSIST"
        | "YELLOW_CARD"
        | "RED_CARD",
    })),
  }))

  const standings = calculateStandingsWithTiebreak(
    participants,
    matchesDto,
  )
  const decision = planTiebreak(standings)

  if (decision.kind === "none") {
    return failure(
      "INVARIANT_VIOLATION",
      "Não há empate absoluto no corte do G4",
    )
  }

  const existingTiebreaks = await prisma.groupTiebreak.count({
    where: { groupId },
  })

  const attempt = existingTiebreaks + 1

  return await prisma.$transaction(async (tx) => {
    const recheck = await tx.groupTiebreak.count({
      where: { groupId, status: { not: "COMPLETED" } },
    })
    if (recheck > 0) {
      throw failure(
        "STATE_CONFLICT",
        "Já existe um desempate ativo para este grupo",
      )
    }

    const tiebreak = await tx.groupTiebreak.create({
      data: {
        groupId,
        attempt,
        slotsAtStake: decision.slotsAtStake,
        status: "PENDING",
        participants: {
          create: decision.participants.map((p) => ({
            participantId: p.id,
          })),
        },
      },
    })

    let matchCount = 0

    if (decision.kind === "decisive_match") {
      const [p1, p2] = decision.participants
      await tx.match.create({
        data: {
          type: "GROUP_TIEBREAK",
          status: "PENDING",
          groupId,
          groupTiebreakId: tiebreak.id,
          participants: {
            create: [
              { participantId: p1.id, role: "HOME" },
              { participantId: p2.id, role: "AWAY" },
            ],
          },
        },
      })
      matchCount = 1
    } else {
      const ids = decision.participants.map((p) => p.id)
      const rounds = generateRoundRobin(ids)

      for (const round of rounds) {
        for (const m of round.matches) {
          await tx.match.create({
            data: {
              type: "GROUP_TIEBREAK",
              status: "PENDING",
              groupId,
              groupTiebreakId: tiebreak.id,
              round: round.round,
              participants: {
                create: [
                  {
                    participantId: m.homeParticipantId,
                    role: "HOME",
                  },
                  {
                    participantId: m.awayParticipantId,
                    role: "AWAY",
                  },
                ],
              },
            },
          })
          matchCount++
        }
      }
    }

    return success({ tiebreakId: tiebreak.id, matchCount })
  })
}
