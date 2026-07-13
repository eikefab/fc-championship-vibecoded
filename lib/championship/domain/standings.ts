import type { MatchDto, ParticipantDto, StandingEntryDto } from "./types"

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
  matches: MatchDto[]
): StandingEntryDto[] {
  if (participants.length !== 5) {
    return []
  }

  const regularMatches = matches.filter(
    (m) => m.type === "REGULAR_GROUP" && m.status !== "PENDING"
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
  const ordered = orderByCriteria(statsArray)
  const guarantees = calculateGuarantees(participants, matches, ordered)

  return ordered.map((stats, index) => ({
    position: index + 1,
    participantId: stats.participantId,
    participantName: stats.participantName,
    points: stats.points,
    matchesPlayed: stats.matchesPlayed,
    wins: stats.wins,
    draws: stats.draws,
    losses: stats.losses,
    goalsScored: stats.goalsScored,
    goalsConceded: stats.goalsConceded,
    goalDifference: stats.goalsScored - stats.goalsConceded,
    yellowCards: stats.yellowCards,
    redCards: stats.redCards,
    provisional: stats.isProvisional || stats.matchesPlayed < 4,
    isLive: stats.isProvisional,
    qualified: index < 4,
    qualificationGuaranteed: guarantees.get(stats.participantId)!.qualified,
    positionGuaranteed: guarantees.get(stats.participantId)!.position,
    requiresTiebreak: false,
  }))
}

export function calculateStandingsWithTiebreak(
  participants: ParticipantDto[],
  matches: MatchDto[]
): StandingEntryDto[] {
  if (participants.length !== 5) {
    return []
  }

  const regularMatches = matches.filter(
    (m) => m.type === "REGULAR_GROUP" && m.status !== "PENDING"
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
  const ordered = orderByCriteria(statsArray)
  const guarantees = calculateGuarantees(participants, matches, ordered)

  const allRegularMatchesCompleted =
    regularMatches.length === 10 &&
    regularMatches.every((m) => m.status === "COMPLETED")

  const hasTiebreak =
    allRegularMatchesCompleted &&
    ordered.length >= 5 &&
    isRawStatsTieCrossingBoundary(ordered)

  return ordered.map((stats, index) => ({
    position: index + 1,
    participantId: stats.participantId,
    participantName: stats.participantName,
    points: stats.points,
    matchesPlayed: stats.matchesPlayed,
    wins: stats.wins,
    draws: stats.draws,
    losses: stats.losses,
    goalsScored: stats.goalsScored,
    goalsConceded: stats.goalsConceded,
    goalDifference: stats.goalsScored - stats.goalsConceded,
    yellowCards: stats.yellowCards,
    redCards: stats.redCards,
    provisional: stats.isProvisional || stats.matchesPlayed < 4,
    isLive: stats.isProvisional,
    qualified: index < 4,
    qualificationGuaranteed: guarantees.get(stats.participantId)!.qualified,
    positionGuaranteed: guarantees.get(stats.participantId)!.position,
    requiresTiebreak: hasTiebreak,
  }))
}

function calculateGuarantees(
  participants: ParticipantDto[],
  matches: MatchDto[],
  currentOrder: RawStats[]
): Map<string, { qualified: boolean; position: boolean }> {
  const regularMatches = matches.filter(
    (match) => match.type === "REGULAR_GROUP"
  )
  const unresolved = regularMatches.filter(
    (match) => match.status !== "COMPLETED"
  )
  const result = new Map<string, { qualified: boolean; position: boolean }>()

  if (unresolved.length === 0) {
    for (const entry of currentOrder) {
      const tied = currentOrder.filter(
        (candidate) =>
          candidate.points === entry.points &&
          candidate.wins === entry.wins &&
          candidate.goalsScored - candidate.goalsConceded ===
            entry.goalsScored - entry.goalsConceded &&
          candidate.goalsScored === entry.goalsScored
      )
      const tieCrossesCut =
        tied.some((candidate) => currentOrder.indexOf(candidate) < 4) &&
        tied.some((candidate) => currentOrder.indexOf(candidate) >= 4)

      result.set(entry.participantId, {
        qualified: currentOrder.indexOf(entry) < 4 && !tieCrossesCut,
        position: tied.length === 1,
      })
    }
    return result
  }

  const basePoints = new Map(
    participants.map((participant) => [participant.id, 0])
  )
  for (const match of regularMatches.filter(
    (candidate) => candidate.status === "COMPLETED"
  )) {
    const home = match.sides.find((side) => side.role === "HOME")
    const away = match.sides.find((side) => side.role === "AWAY")
    if (!home || !away) continue

    const homeScore = home.score ?? 0
    const awayScore = away.score ?? 0
    if (homeScore > awayScore) {
      basePoints.set(
        home.participantId,
        basePoints.get(home.participantId)! + 3
      )
    } else if (awayScore > homeScore) {
      basePoints.set(
        away.participantId,
        basePoints.get(away.participantId)! + 3
      )
    } else {
      basePoints.set(
        home.participantId,
        basePoints.get(home.participantId)! + 1
      )
      basePoints.set(
        away.participantId,
        basePoints.get(away.participantId)! + 1
      )
    }
  }

  const possibleExactPositions = new Map(
    participants.map((participant) => [participant.id, new Set<number>()])
  )
  const canMissG4 = new Set<string>()

  function visit(index: number, points: Map<string, number>) {
    if (index === unresolved.length) {
      for (const participant of participants) {
        const participantPoints = points.get(participant.id)!
        const minimumPosition =
          1 +
          participants.filter(
            (candidate) => points.get(candidate.id)! > participantPoints
          ).length
        const maximumPosition = participants.filter(
          (candidate) => points.get(candidate.id)! >= participantPoints
        ).length

        if (maximumPosition > 4) canMissG4.add(participant.id)
        const positions = possibleExactPositions.get(participant.id)!
        for (
          let position = minimumPosition;
          position <= maximumPosition;
          position++
        ) {
          positions.add(position)
        }
      }
      return
    }

    const match = unresolved[index]
    const home = match.sides.find((side) => side.role === "HOME")
    const away = match.sides.find((side) => side.role === "AWAY")
    if (!home || !away) {
      visit(index + 1, points)
      return
    }

    for (const [homePoints, awayPoints] of [
      [3, 0],
      [1, 1],
      [0, 3],
    ] as const) {
      const next = new Map(points)
      next.set(home.participantId, next.get(home.participantId)! + homePoints)
      next.set(away.participantId, next.get(away.participantId)! + awayPoints)
      visit(index + 1, next)
    }
  }

  visit(0, basePoints)

  for (const participant of participants) {
    result.set(participant.id, {
      qualified: !canMissG4.has(participant.id),
      position: possibleExactPositions.get(participant.id)!.size === 1,
    })
  }
  return result
}

function orderByCriteria(stats: RawStats[]): RawStats[] {
  return [...stats].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.wins !== a.wins) return b.wins - a.wins

    const aGoalDifference = a.goalsScored - a.goalsConceded
    const bGoalDifference = b.goalsScored - b.goalsConceded
    if (bGoalDifference !== aGoalDifference) {
      return bGoalDifference - aGoalDifference
    }

    if (b.goalsScored !== a.goalsScored) return b.goalsScored - a.goalsScored

    return a.participantName.localeCompare(b.participantName, "pt-BR")
  })
}

function isRawStatsTieCrossingBoundary(ordered: RawStats[]): boolean {
  if (ordered.length < 5) return false

  const fourth = ordered[3]
  const fifth = ordered[4]

  return (
    fourth.points === fifth.points &&
    fourth.wins === fifth.wins &&
    fourth.goalsScored - fourth.goalsConceded ===
      fifth.goalsScored - fifth.goalsConceded &&
    fourth.goalsScored === fifth.goalsScored
  )
}

export function getTiedBoundaryParticipants(standings: StandingEntryDto[]): {
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
    fourth.goalDifference === fifth.goalDifference &&
    fourth.goalsScored === fifth.goalsScored
  ) {
    const tied = standings.filter(
      (s) =>
        s.points === fourth.points &&
        s.wins === fourth.wins &&
        s.goalDifference === fourth.goalDifference &&
        s.goalsScored === fourth.goalsScored
    )

    const above = tied.filter((t) => t.position <= 4).length
    return { participants: tied, slotsAtStake: above }
  }

  return { participants: [], slotsAtStake: 0 }
}
