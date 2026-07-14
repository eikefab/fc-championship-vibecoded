export function Scoreline({
  homeScore,
  awayScore,
  homePenaltyScore,
  awayPenaltyScore,
  isWalkover = false,
}: {
  homeScore: number | null
  awayScore: number | null
  homePenaltyScore?: number | null
  awayPenaltyScore?: number | null
  isWalkover?: boolean
}) {
  if (isWalkover) {
    return <span className="font-heading font-bold uppercase tracking-wide">W.O.</span>
  }

  const showScore = homeScore != null && awayScore != null
  const hasPenalties =
    homePenaltyScore != null && awayPenaltyScore != null

  if (!showScore) {
    return (
      <span className="font-mono text-muted-foreground">–</span>
    )
  }

  return (
    <span className="whitespace-nowrap font-mono tabular-nums">
      <span className="font-bold">
        {homeScore}
      </span>
      <span className="mx-1 text-muted-foreground">–</span>
      <span className="font-bold">
        {awayScore}
      </span>
      {hasPenalties && (
        <span className="text-xs text-muted-foreground">
          {" "}
          ({homePenaltyScore}–{awayPenaltyScore} nos pênaltis)
        </span>
      )}
    </span>
  )
}
