import { DomainInvariantError } from "./errors"
import { generateRoundRobin } from "./round-robin"
import type {
  StandingEntryDto,
  TiebreakDecision,
  TiebreakResolutionDto,
  TiebreakStandingEntryDto,
} from "./types"
import type { ParticipantDto } from "./types"

export function planTiebreak(
  standings: StandingEntryDto[],
): TiebreakDecision {
  if (standings.length < 5) {
    return { kind: "none" }
  }

  const fourth = standings[3]
  const fifth = standings[4]

  if (
    fourth.points !== fifth.points ||
    fourth.wins !== fifth.wins ||
    fourth.goalsScored !== fifth.goalsScored ||
    fourth.goalsConceded !== fifth.goalsConceded
  ) {
    return { kind: "none" }
  }

  const tied = standings.filter(
    (s) =>
      s.points === fourth.points &&
      s.wins === fourth.wins &&
      s.goalsScored === fourth.goalsScored &&
      s.goalsConceded === fourth.goalsConceded,
  )

  if (tied.length === 0) {
    return { kind: "none" }
  }

  const above = tied.filter((t) => t.position <= 4).length
  const participants: ParticipantDto[] = tied.map((t) => ({
    id: t.participantId,
    name: t.participantName,
  }))

  if (participants.length === 2) {
    return {
      kind: "decisive_match",
      participants,
      slotsAtStake: above,
    }
  }

  const ids = participants.map((p) => p.id)
  const rounds = generateRoundRobin(ids)

  const participantRounds: ParticipantDto[][][] = rounds.map((r) =>
    r.matches.map((m) => [
      participants.find((p) => p.id === m.homeParticipantId)!,
      participants.find((p) => p.id === m.awayParticipantId)!,
    ]),
  )

  return {
    kind: "series",
    participants,
    slotsAtStake: above,
    rounds: participantRounds,
  }
}

export function resolveTiebreak(
  decision: TiebreakDecision,
  tiebreakStandings: TiebreakStandingEntryDto[],
): TiebreakResolutionDto {
  if (decision.kind === "none") {
    throw new DomainInvariantError(
      "NO_TIEBREAK_NEEDED",
      "Cannot resolve a tiebreak when none is needed",
    )
  }

  if (decision.kind === "decisive_match") {
    const allResolved = tiebreakStandings.length > 0

    if (allResolved) {
      const sorted = [...tiebreakStandings].sort(
        (a, b) => a.position - b.position,
      )

      const qualifiedIds = sorted
        .slice(0, decision.slotsAtStake)
        .map((s) => s.participantId)

      return {
        qualifiedIds,
        requiresAnother: false,
        remainingTied: [],
      }
    }

    return {
      qualifiedIds: [],
      requiresAnother: true,
      remainingTied: decision.participants,
    }
  }

  const sorted = [...tiebreakStandings].sort(
    (a, b) => a.position - b.position,
  )

  let qualifiedIds: string[] = []
  let remainingTied: ParticipantDto[] = []

  if (tiebreakStandings.length >= decision.participants.length) {
    qualifiedIds = sorted
      .slice(0, decision.slotsAtStake)
      .map((s) => s.participantId)

    const lastQualified = sorted[decision.slotsAtStake - 1]
    const firstEliminated = sorted[decision.slotsAtStake]

    if (
      firstEliminated &&
      lastQualified &&
      lastQualified.points === firstEliminated.points &&
      lastQualified.wins === firstEliminated.wins &&
      lastQualified.goalsScored === firstEliminated.goalsScored &&
      lastQualified.goalsConceded === firstEliminated.goalsConceded
    ) {
      const stillTied = tiebreakStandings.filter(
        (s) =>
          s.points === lastQualified.points &&
          s.wins === lastQualified.wins &&
          s.goalsScored === lastQualified.goalsScored &&
          s.goalsConceded === lastQualified.goalsConceded,
      )

      if (stillTied.length >= 2) {
        remainingTied = stillTied.map((s) => ({
          id: s.participantId,
          name: s.participantName,
        }))
        qualifiedIds = qualifiedIds.filter(
          (id) => !remainingTied.some((rt) => rt.id === id),
        )
      }
    }
  }

  const stillNeeded =
    decision.slotsAtStake - qualifiedIds.length

  if (stillNeeded > 0 && remainingTied.length === 0) {
    const nonQualified = decision.participants.filter(
      (p) => !qualifiedIds.includes(p.id),
    )
    qualifiedIds.push(
      ...nonQualified.slice(0, stillNeeded).map((p) => p.id),
    )
  }

  return {
    qualifiedIds,
    requiresAnother: remainingTied.length >= 2,
    remainingTied,
  }
}

export function computeTiebreakStandings(
  participants: ParticipantDto[],
  matchResults: {
    homeParticipantId: string
    awayParticipantId: string
    homeScore: number
    awayScore: number
  }[],
): TiebreakStandingEntryDto[] {
  const statsMap = new Map<string, TiebreakStandingEntryDto>()

  for (const p of participants) {
    statsMap.set(p.id, {
      position: 0,
      participantId: p.id,
      participantName: p.name,
      points: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsScored: 0,
      goalsConceded: 0,
    })
  }

  for (const match of matchResults) {
    const home = statsMap.get(match.homeParticipantId)
    const away = statsMap.get(match.awayParticipantId)
    if (!home || !away) continue

    home.goalsScored += match.homeScore
    home.goalsConceded += match.awayScore
    away.goalsScored += match.awayScore
    away.goalsConceded += match.homeScore

    if (match.homeScore > match.awayScore) {
      home.wins++
      home.points += 3
      away.losses++
    } else if (match.awayScore > match.homeScore) {
      away.wins++
      away.points += 3
      home.losses++
    } else {
      home.draws++
      away.draws++
      home.points += 1
      away.points += 1
    }
  }

  const sorted = [...statsMap.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points

    const h2hA = {
      points: 0,
      wins: 0,
      goalsScored: 0,
      goalsConceded: 0,
    }
    const h2hB = { ...h2hA }

    const h2hMatch = matchResults.find(
      (m) =>
        (m.homeParticipantId === a.participantId &&
          m.awayParticipantId === b.participantId) ||
        (m.homeParticipantId === b.participantId &&
          m.awayParticipantId === a.participantId),
    )

    if (h2hMatch) {
      const aIsHome = h2hMatch.homeParticipantId === a.participantId
      const aScore = aIsHome ? h2hMatch.homeScore : h2hMatch.awayScore
      const bScore = aIsHome ? h2hMatch.awayScore : h2hMatch.homeScore

      h2hA.goalsScored = aScore
      h2hA.goalsConceded = bScore
      h2hB.goalsScored = bScore
      h2hB.goalsConceded = aScore

      if (aScore > bScore) {
        h2hA.wins++
        h2hA.points += 3
      } else if (bScore > aScore) {
        h2hB.wins++
        h2hB.points += 3
      } else {
        h2hA.points += 1
        h2hB.points += 1
      }
    }

    if (h2hB.points !== h2hA.points) return h2hB.points - h2hA.points
    if (h2hB.wins !== h2hA.wins) return h2hB.wins - h2hA.wins
    if (h2hB.goalsScored !== h2hA.goalsScored)
      return h2hB.goalsScored - h2hA.goalsScored
    if (h2hA.goalsConceded !== h2hB.goalsConceded)
      return h2hA.goalsConceded - h2hB.goalsConceded

    if (b.wins !== a.wins) return b.wins - a.wins
    if (b.goalsScored !== a.goalsScored)
      return b.goalsScored - a.goalsScored
    if (a.goalsConceded !== b.goalsConceded)
      return a.goalsConceded - b.goalsConceded

    return 0
  })

  return sorted.map((s, i) => ({ ...s, position: i + 1 }))
}
