import "server-only"
import prisma from "@/lib/prisma"
import {
  generateRoundRobin,
  createRandomSource,
  fisherYatesShuffle,
} from "@/lib/championship/domain"
import type { ActionResult } from "./action-result"
import { failure } from "./action-result"

type DrawResult = {
  groupA: { id: string; code: string; participantIds: string[] }
  groupB: { id: string; code: string; participantIds: string[] }
  matchCount: number
}

export async function drawGroups(
  seedParticipantIds: [string, string],
): Promise<ActionResult<DrawResult>> {
  const [seedA, seedB] = seedParticipantIds

  if (seedA === seedB) {
    return failure("VALIDATION_ERROR", "Os dois cabeças-de-chave devem ser distintos")
  }

  const seeds = await prisma.participant.findMany({
    where: { id: { in: [seedA, seedB] } },
  })

  if (seeds.length !== 2) {
    return failure("NOT_FOUND", "Um ou ambos os cabeças-de-chave não foram encontrados")
  }

  const totalParticipants = await prisma.participant.count()
  if (totalParticipants !== 10) {
    return failure("STATE_CONFLICT", "É necessário ter exatamente 10 participantes")
  }

  const existingGroups = await prisma.group.count()
  if (existingGroups > 0) {
    return failure("STATE_CONFLICT", "Os grupos já foram sorteados")
  }

  const source = createRandomSource()
  const shuffledSeeds = fisherYatesShuffle([seedA, seedB], source)

  const allParticipants = await prisma.participant.findMany({
    select: { id: true, name: true },
  })

  const remaining = allParticipants
    .filter((p) => !shuffledSeeds.includes(p.id))
    .map((p) => p.id)

  const shuffledRemaining = fisherYatesShuffle(remaining, source)

  const groupAIds = [shuffledSeeds[0], ...shuffledRemaining.slice(0, 4)]
  const groupBIds = [shuffledSeeds[1], ...shuffledRemaining.slice(4, 8)]

  const roundsA = generateRoundRobin(groupAIds)
  const roundsB = generateRoundRobin(groupBIds)

  return await prisma.$transaction(async (tx) => {
    const existing = await tx.group.count()
    if (existing > 0) {
      throw failure("STATE_CONFLICT", "Grupos já sorteados concorrentemente")
    }

    const groupA = await tx.group.create({
      data: {
        code: "A",
        memberships: {
          create: groupAIds.map((id, i) => ({
            participantId: id,
            isSeeded: i === 0,
          })),
        },
      },
    })

    for (const r of roundsA) {
      for (const m of r.matches) {
        await tx.match.create({
          data: {
            type: "REGULAR_GROUP",
            round: r.round,
            status: "PENDING",
            groupId: groupA.id,
            participants: {
              create: [
                { participantId: m.homeParticipantId, role: "HOME" },
                { participantId: m.awayParticipantId, role: "AWAY" },
              ],
            },
          },
        })
      }
    }

    const groupB = await tx.group.create({
      data: {
        code: "B",
        memberships: {
          create: groupBIds.map((id, i) => ({
            participantId: id,
            isSeeded: i === 0,
          })),
        },
      },
    })

    for (const r of roundsB) {
      for (const m of r.matches) {
        await tx.match.create({
          data: {
            type: "REGULAR_GROUP",
            round: r.round,
            status: "PENDING",
            groupId: groupB.id,
            participants: {
              create: [
                { participantId: m.homeParticipantId, role: "HOME" },
                { participantId: m.awayParticipantId, role: "AWAY" },
              ],
            },
          },
        })
      }
    }

    return {
      ok: true as const,
      data: {
        groupA: {
          id: groupA.id,
          code: "A",
          participantIds: groupAIds,
        },
        groupB: {
          id: groupB.id,
          code: "B",
          participantIds: groupBIds,
        },
        matchCount: 20,
      },
    }
  })
}

export async function redrawGroups(
  seedParticipantIds: [string, string],
  confirmation: boolean,
): Promise<ActionResult<DrawResult>> {
  if (!confirmation) {
    return failure("CONFIRMATION_REQUIRED", "Confirmação necessária para refazer os grupos")
  }

  const groups = await prisma.group.findMany({
    include: {
      matches: {
        include: { participants: true, events: true },
      },
    },
  })

  if (groups.length === 0) {
    return failure("STATE_CONFLICT", "Não existem grupos para refazer")
  }

  const allMatches = groups.flatMap((g) => g.matches)
  const hasData = allMatches.some(
    (m) =>
      m.status !== "PENDING" ||
      m.participants.some((p) => p.score !== null) ||
      m.events.length > 0,
  )

  if (hasData) {
    return failure(
      "STATE_CONFLICT",
      "Não é possível refazer os grupos pois já existem dados registrados nas partidas",
    )
  }

  return await prisma.$transaction(async (tx) => {
    const recheck = await tx.match.findMany({
      where: { groupId: { not: null } },
      include: { participants: true, events: true },
    })

    const recheckHasData = recheck.some(
      (m) =>
        m.status !== "PENDING" ||
        m.participants.some((p) => p.score !== null) ||
        m.events.length > 0,
    )

    if (recheckHasData) {
      throw failure(
        "STATE_CONFLICT",
        "Dados foram registrados concorrentemente",
      )
    }

    await tx.group.deleteMany()

    return drawGroups(seedParticipantIds)
  })
}
