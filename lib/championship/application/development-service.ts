import "server-only"

import type { Prisma } from "@/app/generated/prisma/client"
import prisma from "@/lib/prisma"
import { failure, success, type ActionResult } from "./action-result"
import { getDashboardData } from "./queries"
import { completeMatch, startMatch, updateMatchScore } from "./match-service"
import { drawKnockoutStage } from "./knockout-service"

type SimulatedPhase = "groups" | "tiebreak" | "quarters" | "semis" | "final"

function randomScore(): number {
  return Math.floor(Math.random() * 5)
}

async function simulateMatches(
  where: Prisma.MatchWhereInput,
): Promise<ActionResult<{ count: number }>> {
  const matches = await prisma.match.findMany({
    where: { ...where, status: { not: "COMPLETED" } },
    select: { id: true, status: true, type: true },
  })

  for (const match of matches) {
    if (match.status === "PENDING") {
      const started = await startMatch(match.id)
      if (!started.ok) return started
    }

    let homeScore = randomScore()
    const awayScore = randomScore()

    if (match.type === "KNOCKOUT" && homeScore === awayScore) {
      homeScore += 1
    }

    const updated = await updateMatchScore(match.id, homeScore, awayScore)
    if (!updated.ok) return updated

    const completed = await completeMatch(match.id)
    if (!completed.ok) return completed
  }

  return success({ count: matches.length })
}

export async function simulateCurrentPhase(): Promise<
  ActionResult<{ phase: SimulatedPhase; matchCount: number }>
> {
  if (process.env.NODE_ENV !== "development") {
    return failure("STATE_CONFLICT", "Simulação disponível apenas em desenvolvimento")
  }

  const dashboard = await getDashboardData()

  if (dashboard.phase === "pre_draw") {
    return failure("STATE_CONFLICT", "Sorteie os grupos antes de simular a fase")
  }

  if (dashboard.phase === "completed") {
    return failure("STATE_CONFLICT", "O campeonato já foi concluído")
  }

  if (dashboard.phase === "groups") {
    const result = await simulateMatches({ type: "REGULAR_GROUP" })
    if (!result.ok) return result

    const existingQuarters = await prisma.match.count({
      where: { knockoutStage: "QUARTER_FINALS" },
    })
    if (existingQuarters === 0) {
      const draw = await drawKnockoutStage("QUARTER_FINALS")
      if (!draw.ok) return draw
    }

    return success({ phase: "groups", matchCount: result.data.count })
  }

  if (dashboard.phase === "tiebreak") {
    const result = await simulateMatches({ type: "GROUP_TIEBREAK" })
    if (!result.ok) return result

    await prisma.groupTiebreak.updateMany({
      where: { status: { not: "COMPLETED" } },
      data: { status: "COMPLETED" },
    })

    const existingQuarters = await prisma.match.count({
      where: { knockoutStage: "QUARTER_FINALS" },
    })
    if (existingQuarters === 0) {
      const draw = await drawKnockoutStage("QUARTER_FINALS")
      if (!draw.ok) return draw
    }

    return success({ phase: "tiebreak", matchCount: result.data.count })
  }

  const [finalPending, semisPending, quartersPending] = await Promise.all([
    prisma.match.count({ where: { knockoutStage: "FINAL", status: { not: "COMPLETED" } } }),
    prisma.match.count({ where: { knockoutStage: "SEMI_FINALS", status: { not: "COMPLETED" } } }),
    prisma.match.count({ where: { knockoutStage: "QUARTER_FINALS", status: { not: "COMPLETED" } } }),
  ])

  if (finalPending > 0) {
    const result = await simulateMatches({ knockoutStage: "FINAL" })
    if (!result.ok) return result
    return success({ phase: "final", matchCount: result.data.count })
  }

  if (semisPending > 0) {
    const result = await simulateMatches({ knockoutStage: "SEMI_FINALS" })
    if (!result.ok) return result
    return success({ phase: "semis", matchCount: result.data.count })
  }

  if (quartersPending > 0) {
    const result = await simulateMatches({ knockoutStage: "QUARTER_FINALS" })
    if (!result.ok) return result

    const existingSemis = await prisma.match.count({
      where: { knockoutStage: "SEMI_FINALS" },
    })
    if (existingSemis === 0) {
      const draw = await drawKnockoutStage("SEMI_FINALS")
      if (!draw.ok) return draw
    }

    return success({ phase: "quarters", matchCount: result.data.count })
  }

  return failure("STATE_CONFLICT", "Não há partidas pendentes na fase atual")
}
