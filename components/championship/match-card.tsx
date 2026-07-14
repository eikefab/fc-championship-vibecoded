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
  walkoverWinnerId?: string | null
  isTiebreak?: boolean
}

export function MatchCard({
  id,
  status,
  homeParticipantName,
  homeParticipantId,
  awayParticipantId,
  awayParticipantName,
  homeScore,
  awayScore,
  homePenaltyScore,
  awayPenaltyScore,
  walkoverWinnerId,
  isTiebreak,
}: MatchCardProps) {
  return (
    <Link
      href={`/partidas/${id}`}
      className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt focus-visible:ring-offset-2"
    >
      <Card className={`surface-shadow border-0 transition-all group-hover:-translate-y-0.5 group-hover:ring-cobalt/30 ${isTiebreak ? "bg-amber-50 ring-amber-300" : "ring-1 ring-[#102a68]/10"}`}>
        <CardContent className="flex min-h-20 items-center justify-between px-4 py-3">
          <div className={`min-w-0 flex-1 truncate text-right text-sm font-semibold ${walkoverWinnerId === homeParticipantId ? "text-[#16845b]" : ""}`}>
            {homeParticipantName}
          </div>
          <div className="mx-3 flex min-w-20 flex-col items-center gap-1">
            <Scoreline
              homeScore={homeScore}
              awayScore={awayScore}
              homePenaltyScore={homePenaltyScore}
              awayPenaltyScore={awayPenaltyScore}
              isWalkover={walkoverWinnerId != null}
            />
            <StatusBadge status={status} />
          </div>
          <div className={`min-w-0 flex-1 truncate text-sm font-semibold ${walkoverWinnerId === awayParticipantId ? "text-[#16845b]" : ""}`}>
            {awayParticipantName}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
