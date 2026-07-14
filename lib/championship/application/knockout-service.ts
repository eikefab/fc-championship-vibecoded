import "server-only"
import prisma from "@/lib/prisma"
import {
  calculateStandingsWithTiebreak,
  computeTiebreakStandings,
  createRandomSource,
  getTiedBoundaryParticipants,
  pairKnockoutEntrants,
  validateQuartersEntrants,
  validateSemisEntrants,
} from "@/lib/championship/domain"
import type { MatchDto } from "@/lib/championship/domain"
import type { ActionResult } from "./action-result"
import { success, failure } from "./action-result"

export async function drawKnockoutStage(
  stage: "QUARTER_FINALS" | "SEMI_FINALS",
): Promise<ActionResult<{ matchCount: number }>> {
  if (stage === "QUARTER_FINALS") {
    const groups = await prisma.group.findMany({
      include: {
        memberships: {
          include: { participant: { select: { name: true } } },
        },
        matches: {
          where: { type: "REGULAR_GROUP" },
          include: {
            participants: {
              include: { participant: { select: { name: true } } },
            },
            events: {
              include: {
                player: { select: { name: true, participantId: true } },
              },
            },
          },
        },
        tiebreaks: {
          orderBy: { attempt: "desc" },
          include: {
            participants: true,
            matches: {
              include: { participants: true },
            },
          },
        },
      },
    })

    if (groups.length !== 2) {
      return failure("STATE_CONFLICT", "Os grupos precisam estar sorteados")
    }

    for (const group of groups) {
      const allComplete = group.matches.every(
        (m) => m.status === "COMPLETED",
      )
      if (!allComplete) {
        return failure(
          "STATE_CONFLICT",
          `Nem todas as partidas do grupo ${group.code} estão concluídas`,
        )
      }

      const pendingTiebreaks = group.tiebreaks.some(
        (t) => t.status !== "COMPLETED",
      )
      if (pendingTiebreaks) {
        return failure(
          "STATE_CONFLICT",
          "Desempate do G4 pendente",
        )
      }
    }

    const existing = await prisma.match.count({
      where: { knockoutStage: "QUARTER_FINALS" },
    })
    if (existing > 0) {
      return failure(
        "STATE_CONFLICT",
        "As quartas já foram sorteadas",
      )
    }

    const qualifiedIds: string[] = []

    for (const group of groups) {
      const participants = group.memberships.map((membership) => ({
        id: membership.participantId,
        name: membership.participant.name,
      }))

      const regularMatches: MatchDto[] = group.matches.map((match) => ({
        id: match.id,
        type: "REGULAR_GROUP",
        status: match.status,
        groupCode: group.code,
        round: match.round,
        knockoutStage: null,
        walkoverWinnerId: match.walkoverWinnerId,
        completedAt: match.completedAt?.toISOString() ?? null,
        sides: match.participants.map((side) => ({
          participantId: side.participantId,
          participantName: side.participant.name,
          role: side.role,
          score: side.score,
          penaltyScore: side.penaltyScore,
        })),
        events: match.events.map((event) => ({
          id: event.id,
          matchId: event.matchId,
          playerId: event.playerId,
          playerName: event.player.name,
          participantId: event.player.participantId,
          eventType: event.eventType,
        })),
      }))

      const standings = calculateStandingsWithTiebreak(
        participants,
        regularMatches,
      )
      const boundary = getTiedBoundaryParticipants(standings)

      if (boundary.participants.length === 0) {
        qualifiedIds.push(
          ...standings.slice(0, 4).map((entry) => entry.participantId),
        )
        continue
      }

      const tiedIds = new Set(
        boundary.participants.map((entry) => entry.participantId),
      )
      const safeQualified = standings
        .slice(0, 4)
        .filter((entry) => !tiedIds.has(entry.participantId))
        .map((entry) => entry.participantId)

      const resolvedTiebreak = group.tiebreaks.find(
        (tiebreak) =>
          tiebreak.status === "COMPLETED" &&
          tiebreak.participants.some((entry) => tiedIds.has(entry.participantId)),
      )

      if (!resolvedTiebreak) {
        return failure(
          "STATE_CONFLICT",
          `O desempate do G4 do grupo ${group.code} ainda não foi resolvido`,
        )
      }

      const persistedResolution = resolvedTiebreak.participants
        .filter((entry) => entry.resolvedPosition != null)
        .sort((a, b) => a.resolvedPosition! - b.resolvedPosition!)

      const resolvedQualified =
        persistedResolution.length === resolvedTiebreak.participants.length
          ? persistedResolution
              .slice(0, resolvedTiebreak.slotsAtStake)
              .map((entry) => entry.participantId)
          : computeTiebreakStandings(
              resolvedTiebreak.participants.map((entry) => ({
                id: entry.participantId,
                name: "",
              })),
              resolvedTiebreak.matches.map((match) => {
                const home = match.participants.find((side) => side.role === "HOME")
                const away = match.participants.find((side) => side.role === "AWAY")
                return {
                  homeParticipantId: home?.participantId ?? "",
                  awayParticipantId: away?.participantId ?? "",
                  homeScore: home?.score ?? 0,
                  awayScore: away?.score ?? 0,
                  walkoverWinnerId: match.walkoverWinnerId,
                }
              }),
            )
              .slice(0, resolvedTiebreak.slotsAtStake)
              .map((entry) => entry.participantId)

      const groupQualified = [...safeQualified, ...resolvedQualified]
      if (groupQualified.length !== 4) {
        return failure(
          "INVARIANT_VIOLATION",
          `Não foi possível determinar os quatro classificados do grupo ${group.code}`,
        )
      }

      qualifiedIds.push(...groupQualified)
    }

    if (qualifiedIds.length !== 8) {
      return failure(
        "STATE_CONFLICT",
        "É necessário ter exatamente 8 classificados",
      )
    }

    try {
      validateQuartersEntrants(qualifiedIds)
    } catch {
      return failure("INVARIANT_VIOLATION", "IDs de classificados inválidos")
    }

    const source = createRandomSource()
    const pairs = pairKnockoutEntrants(qualifiedIds, source)

    return await prisma.$transaction(async (tx) => {
      const recheck = await tx.match.count({
        where: { knockoutStage: "QUARTER_FINALS" },
      })
      if (recheck > 0) {
        throw failure("STATE_CONFLICT", "Quartas já sorteadas concorrentemente")
      }

      for (const pair of pairs) {
        await tx.match.create({
          data: {
            type: "KNOCKOUT",
            knockoutStage: "QUARTER_FINALS",
            status: "PENDING",
            participants: {
              create: [
                {
                  participantId: pair.homeParticipantId,
                  role: "HOME",
                },
                {
                  participantId: pair.awayParticipantId,
                  role: "AWAY",
                },
              ],
            },
          },
        })
      }

      return success({ matchCount: pairs.length })
    })
  }

  if (stage === "SEMI_FINALS") {
    const quarters = await prisma.match.findMany({
      where: { knockoutStage: "QUARTER_FINALS" },
      include: { participants: true },
    })

    if (quarters.length === 0) {
      return failure("STATE_CONFLICT", "As quartas ainda não foram sorteadas")
    }

    const allQuartersDone = quarters.every(
      (m) => m.status === "COMPLETED",
    )
    if (!allQuartersDone) {
      return failure(
        "STATE_CONFLICT",
        "Nem todas as quartas foram concluídas",
      )
    }

    const existing = await prisma.match.count({
      where: { knockoutStage: "SEMI_FINALS" },
    })
    if (existing > 0) {
      return failure(
        "STATE_CONFLICT",
        "As semifinais já foram sorteadas",
      )
    }

      const winners = quarters.map((q) => {
        const home = q.participants.find((p) => p.role === "HOME")!
        const away = q.participants.find((p) => p.role === "AWAY")!
        if (q.walkoverWinnerId) return q.walkoverWinnerId
        if ((home.score ?? 0) > (away.score ?? 0)) return home.participantId
      if ((away.score ?? 0) > (home.score ?? 0)) return away.participantId
      return (home.penaltyScore ?? 0) > (away.penaltyScore ?? 0)
        ? home.participantId
        : away.participantId
    })

    if (winners.length !== 4) {
      return failure(
        "INVARIANT_VIOLATION",
        "Não foi possível determinar os 4 vencedores",
      )
    }

    try {
      validateSemisEntrants(winners)
    } catch {
      return failure("INVARIANT_VIOLATION", "IDs de vencedores inválidos")
    }

    const source = createRandomSource()
    const pairs = pairKnockoutEntrants(winners, source)

    return await prisma.$transaction(async (tx) => {
      const recheck = await tx.match.count({
        where: { knockoutStage: "SEMI_FINALS" },
      })
      if (recheck > 0) {
        throw failure("STATE_CONFLICT", "Semifinais já sorteadas concorrentemente")
      }

      for (const pair of pairs) {
        await tx.match.create({
          data: {
            type: "KNOCKOUT",
            knockoutStage: "SEMI_FINALS",
            status: "PENDING",
            participants: {
              create: [
                {
                  participantId: pair.homeParticipantId,
                  role: "HOME",
                },
                {
                  participantId: pair.awayParticipantId,
                  role: "AWAY",
                },
              ],
            },
          },
        })
      }

      return success({ matchCount: pairs.length })
    })
  }

  return failure("VALIDATION_ERROR", "Fase inválida")
}

export async function redrawKnockoutStage(
  stage: "QUARTER_FINALS" | "SEMI_FINALS",
  confirmation: boolean,
): Promise<ActionResult<{ matchCount: number }>> {
  if (!confirmation) {
    return failure("CONFIRMATION_REQUIRED", "Confirmação necessária para refazer a fase")
  }

  const matches = await prisma.match.findMany({
    where: { knockoutStage: stage },
    include: { participants: true, events: true },
  })

  if (matches.length === 0) {
    return failure("STATE_CONFLICT", `Não existem partidas de ${stage}`)
  }

  const hasData = matches.some(
    (m) =>
      m.status !== "PENDING" ||
      m.participants.some((p) => p.score !== null) ||
      m.events.length > 0,
  )

  if (hasData) {
    return failure(
      "STATE_CONFLICT",
      "Não é possível refazer a fase pois já existem dados registrados",
    )
  }

  return await prisma.$transaction(async (tx) => {
    await tx.match.deleteMany({
      where: { knockoutStage: stage },
    })

    if (stage === "QUARTER_FINALS") {
      return drawKnockoutStage("QUARTER_FINALS")
    }

    return drawKnockoutStage("SEMI_FINALS")
  })
}
