import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { StatusBadge } from "./status-badge"
import { Scoreline } from "./scoreline"
import type { MatchDto } from "@/lib/championship/domain"

const eventLabels: Record<string, string> = {
  GOAL: "Gol",
  ASSIST: "Assistência",
  YELLOW_CARD: "Amarelo",
  RED_CARD: "Vermelho",
}

export function MatchSheet({ match }: { match: MatchDto }) {
  const home = match.sides.find((s) => s.role === "HOME")
  const away = match.sides.find((s) => s.role === "AWAY")

  const homeEvents = match.events.filter(
    (e) => e.participantId === home?.participantId,
  )
  const awayEvents = match.events.filter(
    (e) => e.participantId === away?.participantId,
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <span className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Placar
            </span>
            <StatusBadge status={match.status} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-4 py-4">
            <span className="text-right text-lg font-bold">
              {home?.participantName}
            </span>
            <Scoreline
              homeScore={home?.score ?? null}
              awayScore={away?.score ?? null}
              homePenaltyScore={home?.penaltyScore}
              awayPenaltyScore={away?.penaltyScore}
            />
            <span className="text-lg font-bold">
              {away?.participantName}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Eventos
          </h3>
        </CardHeader>
        <CardContent>
          {match.events.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum evento registrado.
            </p>
          ) : (
            <div className="space-y-4">
              {homeEvents.length > 0 && (
                <div>
                  <h4 className="mb-1 text-xs font-medium uppercase text-muted-foreground">
                    {home?.participantName}
                  </h4>
                  <ul className="space-y-1">
                    {homeEvents.map((e) => (
                      <li
                        key={e.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                          {eventLabels[e.eventType] ?? e.eventType}
                        </span>
                        <span>{e.playerName}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {awayEvents.length > 0 && (
                <div>
                  <Separator className="my-2" />
                  <h4 className="mb-1 text-xs font-medium uppercase text-muted-foreground">
                    {away?.participantName}
                  </h4>
                  <ul className="space-y-1">
                    {awayEvents.map((e) => (
                      <li
                        key={e.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                          {eventLabels[e.eventType] ?? e.eventType}
                        </span>
                        <span>{e.playerName}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
