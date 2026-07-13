import { DomainInvariantError } from "./errors"
import { generateRoundRobin } from "./round-robin"
import type {
  StandingEntryDto,
  TiebreakDecision,
  TiebreakResolutionDto,
  TiebreakStandingEntryDto,
} from "./types"
import type { ParticipantDto } from "./types"

export function planTiebreak(standings: StandingEntryDto[]): TiebreakDecision {
  if (standings.length < 5) {
    return { kind: "none" }
  }

  const fourth = standings[3]
  const fifth = standings[4]

  if (
    fourth.points !== fifth.points ||
    fourth.wins !== fifth.wins ||
    fourth.goalDifference !== fifth.goalDifference ||
    fourth.goalsScored !== fifth.goalsScored
  ) {
    return { kind: "none" }
  }

  const tied = standings.filter(
    (s) =>
      s.points === fourth.points &&
      s.wins === fourth.wins &&
      s.goalDifference === fourth.goalDifference &&
      s.goalsScored === fourth.goalsScored
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
    ])
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
  tiebreakStandings: TiebreakStandingEntryDto[]
): TiebreakResolutionDto {
  if (decision.kind === "none") {
    throw new DomainInvariantError(
      "NO_TIEBREAK_NEEDED",
      "Cannot resolve a tiebreak when none is needed"
    )
  }

  if (decision.kind === "decisive_match") {
    const allResolved = tiebreakStandings.length > 0

    if (allResolved) {
      const sorted = [...tiebreakStandings].sort(
        (a, b) => a.position - b.position
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

  const sorted = [...tiebreakStandings].sort((a, b) => a.position - b.position)

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
      lastQualified.goalsScored - lastQualified.goalsConceded ===
        firstEliminated.goalsScored - firstEliminated.goalsConceded &&
      lastQualified.goalsScored === firstEliminated.goalsScored
    ) {
      const stillTied = tiebreakStandings.filter(
        (s) =>
          s.points === lastQualified.points &&
          s.wins === lastQualified.wins &&
          s.goalsScored - s.goalsConceded ===
            lastQualified.goalsScored - lastQualified.goalsConceded &&
          s.goalsScored === lastQualified.goalsScored
      )

      if (stillTied.length >= 2) {
        remainingTied = stillTied.map((s) => ({
          id: s.participantId,
          name: s.participantName,
        }))
        qualifiedIds = qualifiedIds.filter(
          (id) => !remainingTied.some((rt) => rt.id === id)
        )
      }
    }
  }

  const stillNeeded = decision.slotsAtStake - qualifiedIds.length

  if (stillNeeded > 0 && remainingTied.length === 0) {
    const nonQualified = decision.participants.filter(
      (p) => !qualifiedIds.includes(p.id)
    )
    qualifiedIds.push(...nonQualified.slice(0, stillNeeded).map((p) => p.id))
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
  }[]
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
    if (b.wins !== a.wins) return b.wins - a.wins

    const aGoalDifference = a.goalsScored - a.goalsConceded
    const bGoalDifference = b.goalsScored - b.goalsConceded
    if (bGoalDifference !== aGoalDifference) {
      return bGoalDifference - aGoalDifference
    }

    if (b.goalsScored !== a.goalsScored) return b.goalsScored - a.goalsScored

    return a.participantName.localeCompare(b.participantName, "pt-BR")
  })

  return sorted.map((s, i) => ({ ...s, position: i + 1 }))
}
