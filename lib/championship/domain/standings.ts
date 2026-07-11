import type {
  MatchDto,
  ParticipantDto,
  StandingEntryDto,
} from "./types"

interface RawStats {
  participantId: string
  participantName: string
  points: number
  wins: number
  draws: number
  losses: number
  goalsScored: number
  goalsConceded: number
  yellowCards: number
  redCards: number
  isProvisional: boolean
  matchesPlayed: number
}

export function calculateStandings(
  participants: ParticipantDto[],
  matches: MatchDto[],
): StandingEntryDto[] {
  if (participants.length !== 5) {
    return []
  }

  const regularMatches = matches.filter(
    (m) => m.type === "REGULAR_GROUP" && m.status !== "PENDING",
  )

  const statsMap = new Map<string, RawStats>()

  for (const p of participants) {
    statsMap.set(p.id, {
      participantId: p.id,
      participantName: p.name,
      points: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsScored: 0,
      goalsConceded: 0,
      yellowCards: 0,
      redCards: 0,
      isProvisional: false,
      matchesPlayed: 0,
    })
  }

  for (const match of regularMatches) {
    const isProvisional = match.status === "ONGOING"
    const home = match.sides.find((s) => s.role === "HOME")
    const away = match.sides.find((s) => s.role === "AWAY")

    if (!home || !away) continue

    const homeStats = statsMap.get(home.participantId)
    const awayStats = statsMap.get(away.participantId)

    if (!homeStats || !awayStats) continue

    if (isProvisional) {
      homeStats.isProvisional = true
      awayStats.isProvisional = true
    }

    homeStats.matchesPlayed++
    awayStats.matchesPlayed++

    const homeScore = home.score ?? 0
    const awayScore = away.score ?? 0

    homeStats.goalsScored += homeScore
    homeStats.goalsConceded += awayScore
    awayStats.goalsScored += awayScore
    awayStats.goalsConceded += homeScore

    if (!isProvisional) {
      if (homeScore > awayScore) {
        homeStats.wins++
        homeStats.points += 3
        awayStats.losses++
      } else if (awayScore > homeScore) {
        awayStats.wins++
        awayStats.points += 3
        homeStats.losses++
      } else {
        homeStats.draws++
        awayStats.draws++
        homeStats.points += 1
        awayStats.points += 1
      }
    }

    for (const event of match.events) {
      const playerStats = statsMap.get(event.participantId)
      if (!playerStats) continue

      if (event.eventType === "YELLOW_CARD") {
        playerStats.yellowCards++
      } else if (event.eventType === "RED_CARD") {
        playerStats.redCards++
      }
    }
  }

  const statsArray = [...statsMap.values()]
  const ordered = orderByCriteria(statsArray, regularMatches as MatchDto[])

  return ordered.map((stats, index) => ({
    position: index + 1,
    participantId: stats.participantId,
    participantName: stats.participantName,
    points: stats.points,
    wins: stats.wins,
    draws: stats.draws,
    losses: stats.losses,
    goalsScored: stats.goalsScored,
    goalsConceded: stats.goalsConceded,
    yellowCards: stats.yellowCards,
    redCards: stats.redCards,
    provisional:
      stats.isProvisional || stats.matchesPlayed < 4,
    qualified: index < 4,
    requiresTiebreak: false,
  }))
}

export function calculateStandingsWithTiebreak(
  participants: ParticipantDto[],
  matches: MatchDto[],
): StandingEntryDto[] {
  if (participants.length !== 5) {
    return []
  }

  const regularMatches = matches.filter(
    (m) => m.type === "REGULAR_GROUP" && m.status !== "PENDING",
  )

  const statsMap = new Map<string, RawStats>()

  for (const p of participants) {
    statsMap.set(p.id, {
      participantId: p.id,
      participantName: p.name,
      points: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsScored: 0,
      goalsConceded: 0,
      yellowCards: 0,
      redCards: 0,
      isProvisional: false,
      matchesPlayed: 0,
    })
  }

  for (const match of regularMatches) {
    const isProvisional = match.status === "ONGOING"
    const home = match.sides.find((s) => s.role === "HOME")
    const away = match.sides.find((s) => s.role === "AWAY")

    if (!home || !away) continue

    const homeStats = statsMap.get(home.participantId)
    const awayStats = statsMap.get(away.participantId)

    if (!homeStats || !awayStats) continue

    if (isProvisional) {
      homeStats.isProvisional = true
      awayStats.isProvisional = true
    }

    homeStats.matchesPlayed++
    awayStats.matchesPlayed++

    const homeScore = home.score ?? 0
    const awayScore = away.score ?? 0

    homeStats.goalsScored += homeScore
    homeStats.goalsConceded += awayScore
    awayStats.goalsScored += awayScore
    awayStats.goalsConceded += homeScore

    if (!isProvisional) {
      if (homeScore > awayScore) {
        homeStats.wins++
        homeStats.points += 3
        awayStats.losses++
      } else if (awayScore > homeScore) {
        awayStats.wins++
        awayStats.points += 3
        homeStats.losses++
      } else {
        homeStats.draws++
        awayStats.draws++
        homeStats.points += 1
        awayStats.points += 1
      }
    }

    for (const event of match.events) {
      const playerStats = statsMap.get(event.participantId)
      if (!playerStats) continue

      if (event.eventType === "YELLOW_CARD") {
        playerStats.yellowCards++
      } else if (event.eventType === "RED_CARD") {
        playerStats.redCards++
      }
    }
  }

  const statsArray = [...statsMap.values()]
  const ordered = orderByCriteria(statsArray, regularMatches as MatchDto[])

  const hasOngoing = regularMatches.some((m) => m.status === "ONGOING")

  const hasTiebreak =
    !hasOngoing &&
    ordered.length >= 5 &&
    isRawStatsTieCrossingBoundary(ordered)

  return ordered.map((stats, index) => ({
    position: index + 1,
    participantId: stats.participantId,
    participantName: stats.participantName,
    points: stats.points,
    wins: stats.wins,
    draws: stats.draws,
    losses: stats.losses,
    goalsScored: stats.goalsScored,
    goalsConceded: stats.goalsConceded,
    yellowCards: stats.yellowCards,
    redCards: stats.redCards,
    provisional:
      stats.isProvisional || stats.matchesPlayed < 4,
    qualified: index < 4,
    requiresTiebreak: hasTiebreak,
  }))
}

function orderByCriteria(
  stats: RawStats[],
  regularMatches: MatchDto[],
): RawStats[] {
  return [...stats].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points

    const sortedList = resolveWithMiniTable(
      [a, b],
      regularMatches,
      1,
    )

    const result = sortedList.findIndex(
      (s) => s.participantId === a.participantId,
    )
    const bResult = sortedList.findIndex(
      (s) => s.participantId === b.participantId,
    )

    if (result !== bResult) return result - bResult

    if (b.wins !== a.wins) return b.wins - a.wins

    if (b.goalsScored !== a.goalsScored)
      return b.goalsScored - a.goalsScored

    if (a.goalsConceded !== b.goalsConceded)
      return a.goalsConceded - b.goalsConceded

    return 0
  })
}

function resolveWithMiniTable(
  tied: RawStats[],
  regularMatches: MatchDto[],
  depth: number,
): RawStats[] {
  if (tied.length <= 1 || depth > 1) {
    return [...tied]
  }

  const tiedIds = new Set(tied.map((t) => t.participantId))

  const miniStats = new Map<
    string,
    {
      participantId: string
      points: number
      wins: number
      goalsScored: number
      goalsConceded: number
    }
  >()

  for (const t of tied) {
    miniStats.set(t.participantId, {
      participantId: t.participantId,
      points: 0,
      wins: 0,
      goalsScored: 0,
      goalsConceded: 0,
    })
  }

  for (const match of regularMatches) {
    const home = match.sides.find((s) => s.role === "HOME")
    const away = match.sides.find((s) => s.role === "AWAY")

    if (!home || !away) continue
    if (!tiedIds.has(home.participantId)) continue
    if (!tiedIds.has(away.participantId)) continue

    const homeScore = home.score ?? 0
    const awayScore = away.score ?? 0

    const homeMs = miniStats.get(home.participantId)!
    const awayMs = miniStats.get(away.participantId)!

    homeMs.goalsScored += homeScore
    homeMs.goalsConceded += awayScore
    awayMs.goalsScored += awayScore
    awayMs.goalsConceded += homeScore

    if (homeScore > awayScore) {
      homeMs.wins++
      homeMs.points += 3
    } else if (awayScore > homeScore) {
      awayMs.wins++
      awayMs.points += 3
    } else {
      homeMs.points += 1
      awayMs.points += 1
    }
  }

  return [...tied].sort((a, b) => {
    const am = miniStats.get(a.participantId)!
    const bm = miniStats.get(b.participantId)!

    if (bm.points !== am.points) return bm.points - am.points
    if (bm.wins !== am.wins) return bm.wins - am.wins
    if (bm.goalsScored !== am.goalsScored)
      return bm.goalsScored - am.goalsScored
    if (am.goalsConceded !== bm.goalsConceded)
      return am.goalsConceded - bm.goalsConceded

    return 0
  })
}

function isRawStatsTieCrossingBoundary(
  ordered: RawStats[],
): boolean {
  if (ordered.length < 5) return false

  const fourth = ordered[3]
  const fifth = ordered[4]

  return (
    fourth.points === fifth.points &&
    fourth.wins === fifth.wins &&
    fourth.goalsScored === fifth.goalsScored &&
    fourth.goalsConceded === fifth.goalsConceded
  )
}

export function getTiedBoundaryParticipants(
  standings: StandingEntryDto[],
): {
  participants: StandingEntryDto[]
  slotsAtStake: number
} {
  if (standings.length < 5) {
    return { participants: [], slotsAtStake: 0 }
  }

  const fourth = standings[3]
  const fifth = standings[4]

  if (
    fourth.points === fifth.points &&
    fourth.wins === fifth.wins &&
    fourth.goalsScored === fifth.goalsScored &&
    fourth.goalsConceded === fifth.goalsConceded
  ) {
    const tied = standings.filter(
      (s) =>
        s.points === fourth.points &&
        s.wins === fourth.wins &&
        s.goalsScored === fourth.goalsScored &&
        s.goalsConceded === fourth.goalsConceded,
    )

    const above = tied.filter((t) => t.position <= 4).length
    return { participants: tied, slotsAtStake: above }
  }

  return { participants: [], slotsAtStake: 0 }
}
