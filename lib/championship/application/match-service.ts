import "server-only"
import { createHash } from "node:crypto"
import type { Prisma } from "@/app/generated/prisma/client"
import prisma from "@/lib/prisma"
import type { ActionResult } from "./action-result"
import { success, successEmpty, failure } from "./action-result"

function hashFingerprint(input: string): string {
  return createHash("sha256").update(input).digest("hex").slice(0, 16)
}

export async function startMatch(
  matchId: string,
): Promise<ActionResult<{ homeScore: number; awayScore: number }>> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { participants: true },
  })

  if (!match) {
    return failure("NOT_FOUND", "Partida não encontrada")
  }

  if (match.status !== "PENDING") {
    return failure("STATE_CONFLICT", "A partida não está pendente")
  }

  await prisma.match.update({
    where: { id: matchId },
    data: {
      status: "ONGOING",
      participants: {
        updateMany: match.participants.map((mp) => ({
          where: { id: mp.id },
          data: { score: 0 },
        })),
      },
    },
  })

  return success({ homeScore: 0, awayScore: 0 })
}

export async function updateMatchScore(
  matchId: string,
  homeScore: number,
  awayScore: number,
  homePenaltyScore?: number,
  awayPenaltyScore?: number,
  confirmation?: { fingerprint: string },
): Promise<ActionResult<{ homeScore: number; awayScore: number }>> {
  if (homeScore < 0 || awayScore < 0 || !Number.isInteger(homeScore) || !Number.isInteger(awayScore)) {
    return failure("VALIDATION_ERROR", "Placar deve ser inteiro não negativo")
  }

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { participants: true },
  })

  if (!match) {
    return failure("NOT_FOUND", "Partida não encontrada")
  }

  if (match.status === "COMPLETED") {
    if (confirmation) {
      const currentFp = await computeCorrectionFingerprint(matchId)
      if (confirmation.fingerprint !== currentFp) {
        return failure("STALE_CONFIRMATION", "Os dados da partida foram alterados. Revise as mudanças e confirme novamente.", {
          confirmation: { fingerprint: currentFp, affectedStages: [] },
        })
      }

      const affected = await analyzeCorrection(matchId)
      if (affected.affectedStages.length > 0 && !confirmation) {
        return failure("CONFIRMATION_REQUIRED", "A correção vai apagar fases dependentes", {
          confirmation: {
            fingerprint: currentFp,
            affectedStages: affected.affectedStages,
          },
        })
      }

      await prisma.$transaction(async (tx) => {
        await deleteMatchDownstream(tx, match)
        await applyScoreUpdate(tx, matchId, homeScore, awayScore, homePenaltyScore, awayPenaltyScore)
      })
    } else {
      return failure("CONFIRMATION_REQUIRED", "A partida já foi concluída. Use o fluxo de correção.")
    }
  } else if (match.status !== "ONGOING") {
    return failure("STATE_CONFLICT", "A partida precisa estar em andamento")
  } else {
    await applyScoreUpdate(prisma, matchId, homeScore, awayScore, homePenaltyScore, awayPenaltyScore)
  }

  return success({ homeScore, awayScore })
}

async function applyScoreUpdate(
  tx: Prisma.TransactionClient | typeof prisma,
  matchId: string,
  homeScore: number,
  awayScore: number,
  homePenaltyScore?: number,
  awayPenaltyScore?: number,
) {
  const match = await tx.match.findUnique({
    where: { id: matchId },
    include: { participants: true },
  })
  if (!match) return

  const home = match.participants.find((p) => p.role === "HOME")
  const away = match.participants.find((p) => p.role === "AWAY")

  if (home) {
    await tx.matchParticipant.update({
      where: { id: home.id },
      data: { score: homeScore, penaltyScore: homePenaltyScore },
    })
  }
  if (away) {
    await tx.matchParticipant.update({
      where: { id: away.id },
      data: { score: awayScore, penaltyScore: awayPenaltyScore },
    })
  }
}

export async function addMatchEvent(
  matchId: string,
  playerId: string,
  eventType: "GOAL" | "ASSIST" | "YELLOW_CARD" | "RED_CARD",
): Promise<ActionResult<{ eventId: string }>> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      participants: { include: { participant: { include: { players: true } } } },
    },
  })

  if (!match) {
    return failure("NOT_FOUND", "Partida não encontrada")
  }

  if (match.status === "PENDING") {
    return failure("STATE_CONFLICT", "A partida ainda não foi iniciada")
  }

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: { participant: true },
  })

  if (!player) {
    return failure("NOT_FOUND", "Jogador não encontrado")
  }

  const isInMatch = match.participants.some(
    (mp) => mp.participantId === player.participantId,
  )

  if (!isInMatch) {
    return failure("VALIDATION_ERROR", "O jogador não pertence a nenhum dos participantes da partida")
  }

  const event = await prisma.matchEvent.create({
    data: {
      matchId,
      playerId,
      eventType,
    },
  })

  return success({ eventId: event.id })
}

export async function removeMatchEvent(
  eventId: string,
): Promise<ActionResult<void>> {
  const event = await prisma.matchEvent.findUnique({
    where: { id: eventId },
    include: { match: true },
  })

  if (!event) {
    return failure("NOT_FOUND", "Evento não encontrado")
  }

  if (event.match.status === "PENDING") {
    return failure("STATE_CONFLICT", "Não é possível remover evento de partida pendente")
  }

  await prisma.matchEvent.delete({ where: { id: eventId } })

  return successEmpty()
}

export async function completeMatch(
  matchId: string,
): Promise<ActionResult<{ finalCreated: boolean }>> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { participants: { include: { participant: true } } },
  })

  if (!match) {
    return failure("NOT_FOUND", "Partida não encontrada")
  }

  if (match.status !== "ONGOING") {
    return failure("STATE_CONFLICT", "A partida precisa estar em andamento para ser concluída")
  }

  const home = match.participants.find((p) => p.role === "HOME")
  const away = match.participants.find((p) => p.role === "AWAY")

  if (!home || !away || home.score == null || away.score == null) {
    return failure("VALIDATION_ERROR", "Os placares de ambos os lados são obrigatórios")
  }

  if (
    match.type === "KNOCKOUT" &&
    home.score === away.score &&
    (home.penaltyScore == null || away.penaltyScore == null)
  ) {
    return failure("VALIDATION_ERROR", "Partida eliminatória empatada exige pênaltis")
  }

  if (
    match.type === "KNOCKOUT" &&
    home.score === away.score &&
    home.penaltyScore != null &&
    away.penaltyScore != null &&
    home.penaltyScore === away.penaltyScore
  ) {
    return failure("VALIDATION_ERROR", "Os pênaltis precisam indicar um vencedor")
  }

  let finalCreated = false

  await prisma.$transaction(async (tx) => {
    await tx.match.update({
      where: { id: matchId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    })

    if (
      match.knockoutStage === "SEMI_FINALS" &&
      match.type === "KNOCKOUT"
    ) {
      const semis = await tx.match.findMany({
        where: { knockoutStage: "SEMI_FINALS", status: "COMPLETED" },
        include: { participants: { include: { participant: true } } },
      })

      const finalCount = await tx.match.count({
        where: { knockoutStage: "FINAL" },
      })

      if (semis.length >= 2 && finalCount === 0) {
        const winners = semis.map((s) => {
          const h = s.participants.find((p) => p.role === "HOME")!
          const a = s.participants.find((p) => p.role === "AWAY")!
          if ((h.score ?? 0) > (a.score ?? 0)) return h.participantId
          if ((a.score ?? 0) > (h.score ?? 0)) return a.participantId
          return (h.penaltyScore ?? 0) > (a.penaltyScore ?? 0)
            ? h.participantId
            : a.participantId
        })

        if (winners.length === 2 && winners[0] && winners[1]) {
          await tx.match.create({
            data: {
              type: "KNOCKOUT",
              knockoutStage: "FINAL",
              status: "PENDING",
              participants: {
                create: [
                  {
                    participantId: winners[0],
                    role: "HOME",
                  },
                  {
                    participantId: winners[1],
                    role: "AWAY",
                  },
                ],
              },
            },
          })
          finalCreated = true
        }
      }
    }
  })

  return success({ finalCreated })
}

async function computeCorrectionFingerprint(matchId: string): Promise<string> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { updatedAt: true, knockoutStage: true, type: true, status: true },
  })

  if (!match) return ""

  let downstreamIds: string[] = []

  if (match.type === "REGULAR_GROUP") {
    const downstream = await prisma.match.findMany({
      where: { knockoutStage: { not: null } },
      select: { id: true, updatedAt: true },
    })
    downstreamIds = downstream.map((d) => `${d.id}:${d.updatedAt.toISOString()}`)
  } else if (match.knockoutStage === "QUARTER_FINALS") {
    const downstream = await prisma.match.findMany({
      where: {
        knockoutStage: { in: ["SEMI_FINALS", "FINAL"] },
      },
      select: { id: true, updatedAt: true },
    })
    downstreamIds = downstream.map((d) => `${d.id}:${d.updatedAt.toISOString()}`)
  } else if (match.knockoutStage === "SEMI_FINALS") {
    const downstream = await prisma.match.findMany({
      where: { knockoutStage: "FINAL" },
      select: { id: true, updatedAt: true },
    })
    downstreamIds = downstream.map((d) => `${d.id}:${d.updatedAt.toISOString()}`)
  }

  return hashFingerprint(
    [matchId, match.updatedAt.toISOString(), ...downstreamIds.sort()].join("|"),
  )
}

export async function analyzeCorrection(
  matchId: string,
): Promise<{ affectedStages: string[] }> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { type: true, knockoutStage: true },
  })

  if (!match) return { affectedStages: [] }

  const affectedStages: string[] = []

  if (match.type === "REGULAR_GROUP") {
    const hasQuarters = await prisma.match.count({
      where: { knockoutStage: "QUARTER_FINALS" },
    })
    const hasSemis = await prisma.match.count({
      where: { knockoutStage: "SEMI_FINALS" },
    })
    const hasFinal = await prisma.match.count({
      where: { knockoutStage: "FINAL" },
    })
    if (hasQuarters > 0) affectedStages.push("QUARTER_FINALS")
    if (hasSemis > 0) affectedStages.push("SEMI_FINALS")
    if (hasFinal > 0) affectedStages.push("FINAL")
  } else if (match.knockoutStage === "QUARTER_FINALS") {
    const hasSemis = await prisma.match.count({
      where: { knockoutStage: "SEMI_FINALS" },
    })
    const hasFinal = await prisma.match.count({
      where: { knockoutStage: "FINAL" },
    })
    if (hasSemis > 0) affectedStages.push("SEMI_FINALS")
    if (hasFinal > 0) affectedStages.push("FINAL")
  } else if (match.knockoutStage === "SEMI_FINALS") {
    const hasFinal = await prisma.match.count({
      where: { knockoutStage: "FINAL" },
    })
    if (hasFinal > 0) affectedStages.push("FINAL")
  }

  return { affectedStages }
}

async function deleteMatchDownstream(
  tx: Prisma.TransactionClient | typeof prisma,
  match: { type: string; knockoutStage: string | null },
) {
  if (match.type === "REGULAR_GROUP") {
    await tx.match.deleteMany({
      where: { knockoutStage: { not: null } },
    })
  } else if (match.knockoutStage === "QUARTER_FINALS") {
    await tx.match.deleteMany({
      where: { knockoutStage: { in: ["SEMI_FINALS", "FINAL"] } },
    })
  } else if (match.knockoutStage === "SEMI_FINALS") {
    await tx.match.deleteMany({
      where: { knockoutStage: "FINAL" },
    })
  }
}

export async function correctMatch(
  matchId: string,
  homeScore: number,
  awayScore: number,
  homePenaltyScore?: number,
  awayPenaltyScore?: number,
  confirmation?: { fingerprint: string },
): Promise<ActionResult<{ affectedStages: string[] }>> {
  if (!confirmation) {
    return failure("CONFIRMATION_REQUIRED", "Correção requer confirmação")
  }

  const currentFp = await computeCorrectionFingerprint(matchId)
  if (confirmation.fingerprint !== currentFp) {
    return failure("STALE_CONFIRMATION", "Dados da partida foram alterados. Revise e confirme novamente.", {
      confirmation: {
        fingerprint: currentFp,
        affectedStages: [],
      },
    })
  }

  const affected = await analyzeCorrection(matchId)

  await prisma.$transaction(async (tx) => {
    const match = await tx.match.findUnique({
      where: { id: matchId },
      select: { type: true, knockoutStage: true },
    })
    if (match) {
      await deleteMatchDownstream(tx, match)
    }

    await tx.match.update({
      where: { id: matchId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    })

    await applyScoreUpdate(tx, matchId, homeScore, awayScore, homePenaltyScore, awayPenaltyScore)
  })

  return success({ affectedStages: affected.affectedStages })
}
