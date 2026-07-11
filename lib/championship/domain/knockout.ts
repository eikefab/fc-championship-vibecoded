import { DomainInvariantError } from "./errors"
import { fisherYatesShuffle } from "./random"
import type { RandomSource } from "./random"
import type {
  KnockoutPairDto,
  KnockoutStage,
  MatchSideDto,
} from "./types"

export function getDecisiveWinner(match: {
  status: string
  knockoutStage: KnockoutStage
  sides: MatchSideDto[]
}): string {
  if (match.status !== "COMPLETED") {
    throw new DomainInvariantError(
      "INVALID_MATCH_STATE",
      "Match must be COMPLETED to determine the winner",
    )
  }

  const home = match.sides.find((s) => s.role === "HOME")
  const away = match.sides.find((s) => s.role === "AWAY")

  if (!home || !away) {
    throw new DomainInvariantError(
      "MATCH_NOT_FOUND",
      "Match sides not complete",
    )
  }

  const homeScore = home.score ?? 0
  const awayScore = away.score ?? 0

  if (homeScore > awayScore) {
    return home.participantId
  }

  if (awayScore > homeScore) {
    return away.participantId
  }

  const homePen = home.penaltyScore
  const awayPen = away.penaltyScore

  if (homePen == null || awayPen == null) {
    throw new DomainInvariantError(
      "NO_DECISIVE_WINNER",
      "Knockout match was a draw and penalties are required",
    )
  }

  if (homePen === awayPen) {
    throw new DomainInvariantError(
      "NO_DECISIVE_WINNER",
      "Penalty scores must be different",
    )
  }

  return homePen > awayPen ? home.participantId : away.participantId
}

export function pairKnockoutEntrants(
  ids: readonly string[],
  source: RandomSource,
): KnockoutPairDto[] {
  const shuffled = fisherYatesShuffle(ids, source)
  const pairs: KnockoutPairDto[] = []

  for (let i = 0; i < shuffled.length; i += 2) {
    pairs.push({
      matchId: "",
      homeParticipantId: shuffled[i],
      awayParticipantId: shuffled[i + 1],
    })
  }

  return pairs
}

export function validateQuartersEntrants(
  ids: readonly string[],
): void {
  if (ids.length !== 8) {
    throw new DomainInvariantError(
      "INVALID_CARDINALITY",
      `Quarter-finals require exactly 8 IDs, got ${ids.length}`,
    )
  }

  if (new Set(ids).size !== ids.length) {
    throw new DomainInvariantError(
      "DUPLICATE_ID",
      "Quarter-finals require 8 distinct IDs",
    )
  }
}

export function validateSemisEntrants(
  ids: readonly string[],
): void {
  if (ids.length !== 4) {
    throw new DomainInvariantError(
      "INVALID_CARDINALITY",
      `Semi-finals require exactly 4 IDs, got ${ids.length}`,
    )
  }

  if (new Set(ids).size !== ids.length) {
    throw new DomainInvariantError(
      "DUPLICATE_ID",
      "Semi-finals require 4 distinct IDs",
    )
  }
}

export function pairFinalEntrants(
  ids: readonly string[],
): KnockoutPairDto[] {
  if (ids.length !== 2) {
    throw new DomainInvariantError(
      "INVALID_CARDINALITY",
      `Final requires exactly 2 IDs, got ${ids.length}`,
    )
  }

  return [
    {
      matchId: "",
      homeParticipantId: ids[0],
      awayParticipantId: ids[1],
    },
  ]
}
