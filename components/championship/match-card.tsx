import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { StatusBadge } from "./status-badge"
import { Scoreline } from "./scoreline"

type MatchCardProps = {
  id: string
  status: string
  homeParticipantId: string
  homeParticipantName: string
  awayParticipantId: string
  awayParticipantName: string
  homeScore: number | null
  awayScore: number | null
  homePenaltyScore?: number | null
  awayPenaltyScore?: number | null
  isTiebreak?: boolean
}

export function MatchCard({
  id,
  status,
  homeParticipantName,
  awayParticipantName,
  homeScore,
  awayScore,
  homePenaltyScore,
  awayPenaltyScore,
  isTiebreak,
}: MatchCardProps) {
  return (
    <Link
      href={`/partidas/${id}`}
      className="block transition-opacity hover:opacity-80"
    >
      <Card className={isTiebreak ? "border-amber-200 bg-amber-50/30" : ""}>
        <CardContent className="flex items-center justify-between px-4 py-3">
          <div className="flex-1 text-right font-medium text-sm">
            {homeParticipantName}
          </div>
          <div className="mx-3 flex flex-col items-center gap-1">
            <Scoreline
              homeScore={homeScore}
              awayScore={awayScore}
              homePenaltyScore={homePenaltyScore}
              awayPenaltyScore={awayPenaltyScore}
            />
            <StatusBadge status={status} />
          </div>
          <div className="flex-1 font-medium text-sm">
            {awayParticipantName}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
