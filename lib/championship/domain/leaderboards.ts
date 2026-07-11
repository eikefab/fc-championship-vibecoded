import { compareAlphabeticallyPtBr } from "./utils"
import type { LeaderboardEntryDto, LeaderboardsDto, MatchDto } from "./types"

export function computeLeaderboards(
  matches: MatchDto[],
): LeaderboardsDto {
  const activeMatches = matches.filter(
    (m) => m.status !== "PENDING",
  )

  const goalMap = new Map<string, LeaderboardEntryDto>()
  const assistMap = new Map<string, LeaderboardEntryDto>()
  const yellowMap = new Map<string, LeaderboardEntryDto>()
  const redMap = new Map<string, LeaderboardEntryDto>()

  for (const match of activeMatches) {
    for (const event of match.events) {
      const side = match.sides.find(
        (s) => s.participantId === event.participantId,
      )
      if (!side) continue

      const base = {
        playerId: event.playerId,
        playerName: event.playerName,
        participantId: event.participantId,
        participantName: side.participantName,
        count: 0,
      }

      if (event.eventType === "GOAL") {
        const entry = goalMap.get(event.playerId) ?? {
          ...base,
          count: 0,
        }
        entry.count++
        goalMap.set(event.playerId, entry)
      } else if (event.eventType === "ASSIST") {
        const entry = assistMap.get(event.playerId) ?? {
          ...base,
          count: 0,
        }
        entry.count++
        assistMap.set(event.playerId, entry)
      } else if (event.eventType === "YELLOW_CARD") {
        const entry = yellowMap.get(event.playerId) ?? {
          ...base,
          count: 0,
        }
        entry.count++
        yellowMap.set(event.playerId, entry)
      } else if (event.eventType === "RED_CARD") {
        const entry = redMap.get(event.playerId) ?? {
          ...base,
          count: 0,
        }
        entry.count++
        redMap.set(event.playerId, entry)
      }
    }
  }

  const sortFn = (a: LeaderboardEntryDto, b: LeaderboardEntryDto) => {
    if (b.count !== a.count) return b.count - a.count
    return compareAlphabeticallyPtBr(a.playerName, b.playerName)
  }

  return {
    goals: [...goalMap.values()].sort(sortFn).slice(0, 5),
    assists: [...assistMap.values()].sort(sortFn).slice(0, 5),
    yellowCards: [...yellowMap.values()].sort(sortFn).slice(0, 5),
    redCards: [...redMap.values()].sort(sortFn).slice(0, 5),
  }
}
