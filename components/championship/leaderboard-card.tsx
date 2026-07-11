import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { LeaderboardEntryDto } from "@/lib/championship/domain"

export function LeaderboardCard({
  title,
  entries,
  emptyMessage,
}: {
  title: string
  entries: LeaderboardEntryDto[]
  emptyMessage: string
}) {
  return (
    <Card>
      <CardHeader className="pb-2 pt-4">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        ) : (
          <ol className="space-y-1">
            {entries.map((entry) => (
              <li
                key={entry.playerId}
                className="flex items-center justify-between text-sm"
              >
                <span className="flex items-center gap-1.5">
                  <span className="font-medium">
                    {entry.playerName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({entry.participantName})
                  </span>
                </span>
                <span className="font-mono font-bold tabular-nums">
                  {entry.count}
                </span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
