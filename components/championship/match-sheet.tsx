import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { StatusBadge } from "./status-badge"
import { Scoreline } from "./scoreline"
import type { MatchDto } from "@/lib/championship/domain"

export function MatchSheet({ match }: { match: MatchDto }) {
  const home = match.sides.find((s) => s.role === "HOME")
  const away = match.sides.find((s) => s.role === "AWAY")

  return (
      <Card className="score-grid overflow-hidden border-0 bg-[#102a68] text-white shadow-xl shadow-[#102a68]/15 ring-1 ring-white/10">
        <CardHeader className="border-b border-white/10 pb-3">
          <div className="flex items-center justify-between">
            <span className="font-heading text-sm font-semibold uppercase tracking-[0.16em] text-blue-200">
              Placar oficial
            </span>
            <StatusBadge status={match.status} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-7 sm:gap-8 sm:py-10">
            <span className="truncate text-right font-heading text-2xl font-bold uppercase sm:text-4xl">
              {home?.participantName}
            </span>
            <span className="rounded-xl bg-white px-4 py-3 font-heading text-3xl text-[#102a68] shadow-lg sm:px-6 sm:text-5xl">
              <Scoreline homeScore={home?.score ?? null} awayScore={away?.score ?? null} homePenaltyScore={home?.penaltyScore} awayPenaltyScore={away?.penaltyScore} />
            </span>
            <span className="truncate font-heading text-2xl font-bold uppercase sm:text-4xl">
              {away?.participantName}
            </span>
          </div>
        </CardContent>
      </Card>
  )
}
