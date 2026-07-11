import { DomainInvariantError } from "./errors"

export interface Round {
  round: number
  matches: RoundMatch[]
  byeParticipantId: string
}

export interface RoundMatch {
  homeParticipantId: string
  awayParticipantId: string
}

const BYE_DUMMY = "__BYE__"

export function generateRoundRobin(ids: readonly string[]): Round[] {
  if (ids.length !== 5) {
    throw new DomainInvariantError(
      "INVALID_CARDINALITY",
      `Round-robin requires exactly 5 IDs, got ${ids.length}`,
    )
  }

  const uniqueIds = new Set(ids)
  if (uniqueIds.size !== ids.length) {
    throw new DomainInvariantError(
      "DUPLICATE_ID",
      "Round-robin requires 5 distinct IDs",
    )
  }

  const circle = [...ids, BYE_DUMMY]
  const n = circle.length
  const rounds: Round[] = []

  for (let r = 0; r < ids.length; r++) {
    const matches: RoundMatch[] = []
    let byeParticipantId = ""

    for (let i = 0; i < n; i++) {
      const j = n - 1 - i

      if (i >= j) continue

      const left = circle[i]
      const right = circle[j]

      if (left === BYE_DUMMY) {
        byeParticipantId = right
      } else if (right === BYE_DUMMY) {
        byeParticipantId = left
      } else {
        const isFirstMatch = matches.length === 0
        matches.push({
          homeParticipantId: isFirstMatch ? left : right,
          awayParticipantId: isFirstMatch ? right : left,
        })
      }
    }

    rounds.push({
      round: r + 1,
      matches,
      byeParticipantId,
    })

    const last = circle.pop()!
    circle.splice(1, 0, last)
  }

  return rounds
}

export function getUniquePairs(rounds: Round[]): Set<string> {
  const pairs = new Set<string>()
  for (const round of rounds) {
    for (const match of round.matches) {
      const pair = [match.homeParticipantId, match.awayParticipantId]
        .sort()
        .join("|")
      pairs.add(pair)
    }
  }
  return pairs
}
