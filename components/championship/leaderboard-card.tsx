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
    <Card className="surface-shadow border-0 ring-1 ring-[#102a68]/10">
      <CardHeader className="pb-2 pt-4">
        <h3 className="font-heading text-base font-bold uppercase tracking-wide text-[#102a68]">
          {title}
        </h3>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        ) : (
          <ol className="space-y-2">
            {entries.map((entry, index) => (
              <li
                key={entry.playerId}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-muted font-mono text-[10px] font-bold text-muted-foreground">{index + 1}</span>
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
