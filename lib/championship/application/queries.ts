import "server-only"
import prisma from "@/lib/prisma"
import {
  calculateStandingsWithTiebreak,
  computeLeaderboards,
} from "@/lib/championship/domain"
import type {
  MatchDto,
  StandingEntryDto,
  LeaderboardsDto,
  KnockoutNodeDto,
} from "@/lib/championship/domain"

type DashboardData = {
  phase: "pre_draw" | "groups" | "tiebreak" | "knockout" | "completed"
  groups: { id: string; code: string }[] | null
  groupCount: number
  pendingMatches: number
  ongoingMatches: number
  completedMatches: number
  hasTiebreakPending: boolean
  knockoutStage: string | null
  recentResults: {
    id: string
    homeName: string
    awayName: string
    homeScore: number | null
    awayScore: number | null
    status: string
  }[]
  leaderboards: LeaderboardsDto
}

export async function getDashboardData(): Promise<DashboardData> {
  const [groups, matchCounts, recentMatches, allMatches] =
    await Promise.all([
      prisma.group.findMany({
        select: { id: true, code: true },
      }),
      prisma.match.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      prisma.match.findMany({
        where: { status: { not: "PENDING" } },
        orderBy: { updatedAt: "desc" },
        take: 10,
        include: {
          participants: {
            include: { participant: { select: { name: true } } },
          },
        },
      }),
      prisma.match.findMany({
        where: { status: { not: "PENDING" } },
        include: {
          participants: {
            include: { participant: { select: { id: true, name: true } } },
          },
          events: {
            include: {
              player: {
                select: { id: true, name: true, participantId: true },
              },
            },
          },
        },
      }),
    ])

  const pendingCount =
    matchCounts.find((m) => m.status === "PENDING")?._count.id ?? 0
  const ongoingCount =
    matchCounts.find((m) => m.status === "ONGOING")?._count.id ?? 0
  const completedCount =
    matchCounts.find((m) => m.status === "COMPLETED")?._count.id ?? 0

  const leaderboards = computeLeaderboards(
    allMatches.map(toMatchDto),
  )

  const hasGroups = groups.length > 0
  const knockoutMatches = await prisma.match.findMany({
    where: { knockoutStage: { not: null } },
    select: { knockoutStage: true, status: true },
  })

  let phase: DashboardData["phase"] = "pre_draw"
  let knockoutStage: string | null = null

  if (hasGroups) {
    const regularMatches = await prisma.match.count({
      where: { type: "REGULAR_GROUP" },
    })
    const regularComplete = await prisma.match.count({
      where: { type: "REGULAR_GROUP", status: "COMPLETED" },
    })

    if (regularComplete < regularMatches) {
      phase = "groups"
    } else {
      const tiebreaks = await prisma.groupTiebreak.count({
        where: { status: { not: "COMPLETED" } },
      })
      if (tiebreaks > 0) {
        phase = "tiebreak"
      } else {
        const quarters = knockoutMatches.filter((m) => m.knockoutStage === "QUARTER_FINALS")
        const semis = knockoutMatches.filter((m) => m.knockoutStage === "SEMI_FINALS")
        const finals = knockoutMatches.filter((m) => m.knockoutStage === "FINAL")

        if (finals.length > 0) {
          knockoutStage = "FINAL"
          phase = finals.every((match) => match.status === "COMPLETED")
            ? "completed"
            : "knockout"
        } else if (semis.length > 0) {
          phase = "knockout"
          knockoutStage = "SEMI_FINALS"
        } else if (quarters.length > 0) {
          phase = "knockout"
          knockoutStage = "QUARTER_FINALS"
        } else {
          phase = "groups"
        }
      }
    }
  }

  return {
    phase,
    groups: hasGroups ? groups.map((g) => ({ id: g.id, code: g.code })) : null,
    groupCount: groups.length,
    pendingMatches: pendingCount,
    ongoingMatches: ongoingCount,
    completedMatches: completedCount,
    hasTiebreakPending: false,
    knockoutStage,
    recentResults: recentMatches.map((m) => {
      const home = m.participants.find((p) => p.role === "HOME")
      const away = m.participants.find((p) => p.role === "AWAY")
      return {
        id: m.id,
        homeName: home?.participant.name ?? "?",
        awayName: away?.participant.name ?? "?",
        homeScore: home?.score ?? null,
        awayScore: away?.score ?? null,
        status: m.status,
      }
    }),
    leaderboards,
  }
}

type GroupData = {
  id: string
  code: string
  participants: {
    participantId: string
    participantName: string
    isSeeded: boolean
  }[]
  standings: StandingEntryDto[]
  rounds: {
    round: number
    matches: {
      id: string
      status: string
      homeParticipantId: string
      homeParticipantName: string
      awayParticipantId: string
      awayParticipantName: string
      homeScore: number | null
      awayScore: number | null
      isTiebreak: boolean
    }[]
    byeParticipantId: string
    byeParticipantName: string
  }[]
  tiebreaks: {
    id: string
    attempt: number
    slotsAtStake: number
    status: string
    participants: { participantId: string; participantName: string }[]
    matches: {
      id: string
      status: string
    }[]
  }[]
}

export async function getGroupsData(): Promise<GroupData[]> {
  const groups = await prisma.group.findMany({
    include: {
      memberships: {
        include: { participant: { select: { name: true } } },
      },
      matches: {
        include: {
          participants: {
            include: { participant: { select: { name: true } } },
          },
        },
        orderBy: [{ round: "asc" }, { createdAt: "asc" }],
      },
      tiebreaks: {
        include: {
          participants: {
            include: { participant: { select: { name: true } } },
          },
          matches: {
            include: {
              participants: {
                include: { participant: { select: { name: true } } },
              },
            },
          },
        },
      },
    },
  })

  return groups.map((group) => {
    const participants = group.memberships.map((m) => ({
      participantId: m.participantId,
      participantName: m.participant.name,
      isSeeded: m.isSeeded,
    }))

    const regularMatches = group.matches
      .filter((m) => m.type === "REGULAR_GROUP")
      .map(toMatchDto)

    const standings = calculateStandingsWithTiebreak(
      participants.map((p) => ({ id: p.participantId, name: p.participantName })),
      regularMatches,
    )

    const roundMap = new Map<
      number,
      {
        round: number
        matches: {
          id: string
          status: string
          homeParticipantId: string
          homeParticipantName: string
          awayParticipantId: string
          awayParticipantName: string
          homeScore: number | null
          awayScore: number | null
          isTiebreak: boolean
        }[]
        byeParticipantId: string
        byeParticipantName: string
      }
    >()

    for (const match of group.matches) {
      if (match.type !== "REGULAR_GROUP") continue
      const r = match.round ?? 0
      if (!roundMap.has(r)) {
        roundMap.set(r, {
          round: r,
          matches: [],
          byeParticipantId: "",
          byeParticipantName: "",
        })
      }

      const round = roundMap.get(r)!
      const home = match.participants.find((p) => p.role === "HOME")
      const away = match.participants.find((p) => p.role === "AWAY")

      round.matches.push({
        id: match.id,
        status: match.status,
        homeParticipantId: home?.participantId ?? "",
        homeParticipantName: home?.participant.name ?? "",
        awayParticipantId: away?.participantId ?? "",
        awayParticipantName: away?.participant.name ?? "",
        homeScore: home?.score ?? null,
        awayScore: away?.score ?? null,
        isTiebreak: false,
      })
    }

    const rounds = [...roundMap.values()].sort(
      (a, b) => a.round - b.round,
    )

    return {
      id: group.id,
      code: group.code,
      participants,
      standings,
      rounds,
      tiebreaks: group.tiebreaks.map((tb) => ({
        id: tb.id,
        attempt: tb.attempt,
        slotsAtStake: tb.slotsAtStake,
        status: tb.status,
        participants: tb.participants.map((tp) => ({
          participantId: tp.participantId,
          participantName: tp.participant.name,
        })),
        matches: tb.matches.map((m) => ({
          id: m.id,
          status: m.status,
        })),
      })),
    }
  })
}

type KnockoutData = {
  quarters: KnockoutNodeDto[]
  semis: KnockoutNodeDto[]
  final: KnockoutNodeDto[]
  canDrawQuarters: boolean
  canDrawSemis: boolean
  canRedrawQuarters: boolean
  canRedrawSemis: boolean
}

export async function getKnockoutData(): Promise<KnockoutData> {
  const matches = await prisma.match.findMany({
    where: { knockoutStage: { not: null } },
    include: {
      participants: {
        include: { participant: { select: { name: true } } },
      },
    },
  })

  const toNode = (
    m: (typeof matches)[number],
  ): KnockoutNodeDto => {
    const home = m.participants.find((p) => p.role === "HOME")
    const away = m.participants.find((p) => p.role === "AWAY")

    let winnerId: string | null = null
    if (m.status === "COMPLETED") {
      if (home && away) {
        const hScore = home.score ?? 0
        const aScore = away.score ?? 0
        if (hScore > aScore) winnerId = home.participantId
        else if (aScore > hScore) winnerId = away.participantId
        else {
          const hPen = home.penaltyScore ?? -1
          const aPen = away.penaltyScore ?? -1
          winnerId = hPen > aPen ? home.participantId : away.participantId
        }
      }
    }

    return {
      matchId: m.id,
      stage: m.knockoutStage! as KnockoutNodeDto["stage"],
      status: m.status as KnockoutNodeDto["status"],
      homeParticipantId: home?.participantId ?? null,
      homeParticipantName: home?.participant.name ?? null,
      awayParticipantId: away?.participantId ?? null,
      awayParticipantName: away?.participant.name ?? null,
      homeScore: home?.score ?? null,
      awayScore: away?.score ?? null,
      homePenaltyScore: home?.penaltyScore ?? null,
      awayPenaltyScore: away?.penaltyScore ?? null,
      winnerId,
    }
  }

  const quarters = matches
    .filter((m) => m.knockoutStage === "QUARTER_FINALS")
    .map(toNode)
  const semis = matches
    .filter((m) => m.knockoutStage === "SEMI_FINALS")
    .map(toNode)
  const final = matches
    .filter((m) => m.knockoutStage === "FINAL")
    .map(toNode)

  const canDrawQuarters =
    quarters.length === 0
  const canDrawSemis =
    quarters.length > 0 &&
    quarters.every((q) => q.status === "COMPLETED") &&
    semis.length === 0
  const canRedrawQuarters =
    quarters.length > 0 &&
    quarters.every((q) => q.status === "PENDING")
  const canRedrawSemis =
    semis.length > 0 &&
    semis.every((s) => s.status === "PENDING")

  return {
    quarters,
    semis,
    final,
    canDrawQuarters,
    canDrawSemis,
    canRedrawQuarters,
    canRedrawSemis,
  }
}

export async function getParticipantData(
  participantId: string,
): Promise<{
  id: string
  name: string
  players: {
    id: string
    name: string
    team: string
    positions: string[]
    overall: number
  }[]
} | null> {
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    include: {
      players: {
        select: {
          id: true,
          name: true,
          team: true,
          positions: true,
          overall: true,
        },
      },
    },
  })

  if (!participant) return null

  return {
    id: participant.id,
    name: participant.name,
    players: participant.players,
  }
}

export async function getMatchData(
  matchId: string,
): Promise<MatchDto | null> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      participants: {
        include: { participant: { select: { name: true } } },
      },
      events: {
        include: {
          player: {
            select: { id: true, name: true, participantId: true },
          },
        },
      },
      group: { select: { code: true } },
    },
  })

  if (!match) return null

  return toMatchDto(match)
}

function toMatchDto(m: {
  id: string
  type: string
  status: string
  round?: number | null
  completedAt?: Date | string | null
  knockoutStage?: string | null
  group?: { code: string } | null
  participants: {
    participantId: string
    role: string
    score?: number | null
    penaltyScore?: number | null
    participant: { name: string }
  }[]
  events?: {
    id: string
    matchId: string
    playerId: string
    eventType: string
    player?: { id: string; name: string; participantId: string }
  }[]
}): MatchDto {
  return {
    id: m.id,
    type: m.type as MatchDto["type"],
    status: m.status as MatchDto["status"],
    groupCode: (m.group?.code as MatchDto["groupCode"]) ?? null,
    round: m.round ?? null,
    knockoutStage:
      (m.knockoutStage as MatchDto["knockoutStage"]) ?? null,
    completedAt:
      m.completedAt instanceof Date
        ? m.completedAt.toISOString()
        : typeof m.completedAt === "string"
          ? m.completedAt
          : null,
    sides: m.participants.map((p) => ({
      participantId: p.participantId,
      participantName: p.participant.name,
      role: p.role as "HOME" | "AWAY",
      score: p.score ?? null,
      penaltyScore: p.penaltyScore ?? null,
    })),
    events: (m.events ?? []).map((e) => ({
      id: e.id,
      matchId: e.matchId,
      playerId: e.playerId,
      playerName: e.player?.name ?? "",
      participantId: e.player?.participantId ?? "",
      eventType: e.eventType as MatchDto["events"][number]["eventType"],
    })),
  }
}

export { computeLeaderboards }
