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

  if (match.walkoverWinnerId) {
    return failure("STATE_CONFLICT", "Esta partida foi concluída por W.O.; use a correção de W.O.")
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

    if (match.knockoutStage === "SEMI_FINALS" && match.type === "KNOCKOUT") {
      finalCreated = await createFinalIfNeeded(tx)
    }
  })

  return success({ finalCreated })
}

export async function declareWalkover(
  matchId: string,
  winnerParticipantId: string,
): Promise<ActionResult<{ winnerParticipantId: string; finalCreated: boolean }>> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { participants: true },
  })

  if (!match) return failure("NOT_FOUND", "Partida não encontrada")
  if (match.status !== "PENDING") {
    return failure("STATE_CONFLICT", "W.O. só pode ser registrado antes de iniciar a partida")
  }

  const isParticipant = match.participants.some(
    (participant) => participant.participantId === winnerParticipantId,
  )
  if (!isParticipant) {
    return failure("VALIDATION_ERROR", "O vencedor do W.O. precisa participar da partida")
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.match.update({
      where: { id: matchId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        walkoverWinnerId: winnerParticipantId,
      },
    })

    const finalCreated =
      match.type === "KNOCKOUT" && match.knockoutStage === "SEMI_FINALS"
        ? await createFinalIfNeeded(tx)
        : false

    return { winnerParticipantId, finalCreated }
  })

  return success(result)
}

export async function correctWalkover(
  matchId: string,
  winnerParticipantId: string | null,
  confirmation?: { fingerprint: string },
): Promise<ActionResult<{ affectedStages: string[] }>> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { participants: true },
  })

  if (!match) return failure("NOT_FOUND", "Partida não encontrada")
  if (match.status !== "COMPLETED" || !match.walkoverWinnerId) {
    return failure("STATE_CONFLICT", "A partida não possui um W.O. corrigível")
  }
  if (
    winnerParticipantId &&
    !match.participants.some(
      (participant) => participant.participantId === winnerParticipantId,
    )
  ) {
    return failure("VALIDATION_ERROR", "O vencedor do W.O. precisa participar da partida")
  }

  const currentFp = await computeCorrectionFingerprint(matchId)
  const affected = await analyzeCorrection(matchId)
  if (!confirmation) {
    return failure("CONFIRMATION_REQUIRED", "Confirme a correção do W.O.", {
      confirmation: { fingerprint: currentFp, affectedStages: affected.affectedStages },
    })
  }
  if (confirmation.fingerprint !== currentFp) {
    return failure("STALE_CONFIRMATION", "Os dados da partida foram alterados. Revise e confirme novamente.", {
      confirmation: { fingerprint: currentFp, affectedStages: affected.affectedStages },
    })
  }

  await prisma.$transaction(async (tx) => {
    await deleteMatchDownstream(tx, match)
    await tx.match.update({
      where: { id: matchId },
      data: winnerParticipantId
        ? { walkoverWinnerId: winnerParticipantId, completedAt: new Date() }
        : {
            walkoverWinnerId: null,
            status: "PENDING",
            completedAt: null,
            participants: {
              updateMany: match.participants.map((participant) => ({
                where: { id: participant.id },
                data: { score: null, penaltyScore: null },
              })),
            },
          },
    })
  })

  return success({ affectedStages: affected.affectedStages })
}

async function createFinalIfNeeded(
  tx: Prisma.TransactionClient,
): Promise<boolean> {
  const semis = await tx.match.findMany({
    where: { knockoutStage: "SEMI_FINALS", status: "COMPLETED" },
    include: { participants: true },
  })
  const finalCount = await tx.match.count({ where: { knockoutStage: "FINAL" } })
  if (semis.length < 2 || finalCount > 0) return false

  const winners = semis.map((semi) => {
    if (semi.walkoverWinnerId) return semi.walkoverWinnerId
    const home = semi.participants.find((participant) => participant.role === "HOME")!
    const away = semi.participants.find((participant) => participant.role === "AWAY")!
    if ((home.score ?? 0) !== (away.score ?? 0)) {
      return (home.score ?? 0) > (away.score ?? 0)
        ? home.participantId
        : away.participantId
    }
    return (home.penaltyScore ?? 0) > (away.penaltyScore ?? 0)
      ? home.participantId
      : away.participantId
  })

  if (winners.length !== 2 || winners.some((winner) => !winner)) return false

  await tx.match.create({
    data: {
      type: "KNOCKOUT",
      knockoutStage: "FINAL",
      status: "PENDING",
      participants: {
        create: [
          { participantId: winners[0], role: "HOME" },
          { participantId: winners[1], role: "AWAY" },
        ],
      },
    },
  })
  return true
}

async function computeCorrectionFingerprint(matchId: string): Promise<string> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { updatedAt: true, knockoutStage: true, type: true, groupId: true, status: true },
  })

  if (!match) return ""

  let downstreamIds: string[] = []

  if (match.type === "REGULAR_GROUP") {
    const downstream = await prisma.match.findMany({
      where: { knockoutStage: { not: null } },
      select: { id: true, updatedAt: true },
    })
    downstreamIds = downstream.map((d) => `${d.id}:${d.updatedAt.toISOString()}`)
    if (match.groupId) {
      const tiebreaks = await prisma.groupTiebreak.findMany({
        where: { groupId: match.groupId },
        select: { id: true, updatedAt: true },
      })
      downstreamIds.push(
        ...tiebreaks.map((tiebreak) => `${tiebreak.id}:${tiebreak.updatedAt.toISOString()}`),
      )
    }
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
    select: { type: true, knockoutStage: true, groupId: true },
  })

  if (!match) return { affectedStages: [] }

  const affectedStages: string[] = []

  if (match.type === "REGULAR_GROUP") {
    if (match.groupId) {
      const tiebreakCount = await prisma.groupTiebreak.count({ where: { groupId: match.groupId } })
      if (tiebreakCount > 0) affectedStages.push("GROUP_TIEBREAK")
    }
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
  } else if (match.type === "GROUP_TIEBREAK") {
    const hasQuarters = await prisma.match.count({ where: { knockoutStage: "QUARTER_FINALS" } })
    const hasSemis = await prisma.match.count({ where: { knockoutStage: "SEMI_FINALS" } })
    const hasFinal = await prisma.match.count({ where: { knockoutStage: "FINAL" } })
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
  match: { type: string; knockoutStage: string | null; groupId?: string | null },
) {
  if (match.type === "REGULAR_GROUP") {
    if (match.groupId) {
      await tx.groupTiebreak.deleteMany({ where: { groupId: match.groupId } })
    }
    await tx.match.deleteMany({
      where: { knockoutStage: { not: null } },
    })
  } else if (match.type === "GROUP_TIEBREAK") {
    await tx.match.deleteMany({ where: { knockoutStage: { not: null } } })
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
  const currentMatch = await prisma.match.findUnique({
    where: { id: matchId },
    select: { walkoverWinnerId: true },
  })
  if (currentMatch?.walkoverWinnerId) {
    return failure("STATE_CONFLICT", "Esta partida foi concluída por W.O.; use a correção de W.O.")
  }

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
      select: { type: true, knockoutStage: true, groupId: true },
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
