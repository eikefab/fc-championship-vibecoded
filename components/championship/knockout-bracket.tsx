import { ScrollArea } from "@/components/ui/scroll-area"
import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { StatusBadge } from "./status-badge"
import { Scoreline } from "./scoreline"
import type { KnockoutNodeDto } from "@/lib/championship/domain"

function BracketCard({ node, label }: { node: KnockoutNodeDto; label: string }) {
  const homeName = node.homeParticipantName ?? "?"
  const awayName = node.awayParticipantName ?? "?"

  return (
    <Link href={`/partidas/${node.matchId}`} className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt focus-visible:ring-offset-2">
    <Card
      className={`surface-shadow border-0 transition-transform group-hover:-translate-y-0.5 ${
        node.winnerId
          ? "bg-emerald-50 ring-1 ring-emerald-200"
          : "ring-1 ring-[#102a68]/10"
      }`}
    >
      <CardHeader className="pb-1 pt-3">
        <div className="flex items-center justify-between">
          <span className="font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          <StatusBadge status={node.status} />
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="flex items-center justify-between text-sm">
          <span className={`flex-1 truncate ${node.winnerId === node.homeParticipantId ? "font-bold text-[#16845b]" : ""}`}>
            {homeName}
          </span>
          <span className="mx-2">
            <Scoreline
              homeScore={node.homeScore}
              awayScore={node.awayScore}
              homePenaltyScore={node.homePenaltyScore}
              awayPenaltyScore={node.awayPenaltyScore}
              isWalkover={node.walkoverWinnerId != null}
            />
          </span>
          <span
            className={`flex-1 truncate text-right ${node.winnerId === node.awayParticipantId ? "font-bold text-[#16845b]" : ""}`}
          >
            {awayName}
          </span>
        </div>
      </CardContent>
    </Card>
    </Link>
  )
}

export function KnockoutBracket({
  quarters,
  semis,
  final,
}: {
  quarters: KnockoutNodeDto[]
  semis: KnockoutNodeDto[]
  final: KnockoutNodeDto[]
}) {
  if (quarters.length === 0 && semis.length === 0 && final.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        O mata-mata será sorteado após a fase de grupos e desempates.
      </p>
    )
  }

  return (
    <ScrollArea className="w-full">
      <div className="flex min-w-[780px] items-stretch gap-12 rounded-2xl border border-[#102a68]/10 bg-white/45 p-5 sm:p-7">
        {quarters.length > 0 && (
          <div className="relative flex w-56 flex-col justify-around gap-3 after:absolute after:-right-6 after:top-1/2 after:h-px after:w-6 after:bg-[#1746c7]/25">
            <h3 className="absolute -top-1 left-0 font-heading text-sm font-bold uppercase tracking-wide text-[#102a68]">
              Quartas
            </h3>
            {quarters.map((q) => (
              <BracketCard
                key={q.matchId}
                node={q}
                label="Quartas"
              />
            ))}
          </div>
        )}

        {semis.length > 0 && (
          <div className="relative flex w-56 flex-col justify-around gap-3 before:absolute before:-left-6 before:top-1/2 before:h-px before:w-6 before:bg-[#1746c7]/25 after:absolute after:-right-6 after:top-1/2 after:h-px after:w-6 after:bg-[#1746c7]/25">
            <h3 className="absolute -top-1 left-0 font-heading text-sm font-bold uppercase tracking-wide text-[#102a68]">
              Semifinais
            </h3>
            {semis.map((s) => (
              <BracketCard
                key={s.matchId}
                node={s}
                label="Semifinais"
              />
            ))}
          </div>
        )}

        {final.length > 0 && (
          <div className="relative flex w-56 flex-col justify-center before:absolute before:-left-6 before:top-1/2 before:h-px before:w-6 before:bg-[#1746c7]/25">
            <h3 className="mb-3 font-heading text-sm font-bold uppercase tracking-wide text-[#102a68]">
              Final
            </h3>
            {final.map((f) => (
              <BracketCard
                key={f.matchId}
                node={f}
                label="Final"
              />
            ))}
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
