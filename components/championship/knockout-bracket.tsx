import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { StatusBadge } from "./status-badge"
import { Scoreline } from "./scoreline"
import type { KnockoutNodeDto } from "@/lib/championship/domain"

function BracketCard({ node, label }: { node: KnockoutNodeDto; label: string }) {
  const homeName = node.homeParticipantName ?? "?"
  const awayName = node.awayParticipantName ?? "?"

  return (
    <Card
      className={
        node.winnerId
          ? "border-emerald-200 bg-emerald-50/30"
          : ""
      }
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
          <span
            className={`flex-1 ${node.winnerId === node.homeParticipantId ? "font-bold" : ""}`}
          >
            {homeName}
          </span>
          <span className="mx-2">
            <Scoreline
              homeScore={node.homeScore}
              awayScore={node.awayScore}
              homePenaltyScore={node.homePenaltyScore}
              awayPenaltyScore={node.awayPenaltyScore}
            />
          </span>
          <span
            className={`flex-1 text-right ${node.winnerId === node.awayParticipantId ? "font-bold" : ""}`}
          >
            {awayName}
          </span>
        </div>
      </CardContent>
    </Card>
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
      <div className="flex min-w-[640px] gap-6 py-4">
        {quarters.length > 0 && (
          <div className="flex w-56 flex-col gap-3">
            <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
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
          <div className="flex w-56 flex-col justify-center gap-3">
            <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
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
          <div className="flex w-56 flex-col justify-center">
            <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
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
