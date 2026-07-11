import { getDashboardData } from "@/lib/championship/application/queries"
import prisma from "@/lib/prisma"
import { CompetitionProgress } from "@/components/championship/competition-progress"
import { GroupDrawForm } from "@/components/championship/group-draw-form"
import { LeaderboardCard } from "@/components/championship/leaderboard-card"
import { MatchCard } from "@/components/championship/match-card"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default async function HomePage() {
  const data = await getDashboardData()

  const participants = data.phase === "pre_draw"
    ? await prisma.participant.findMany({
        select: { id: true, name: true },
      })
    : []

  return (
    <div className="space-y-6">
      <CompetitionProgress phase={data.phase} />

      {data.phase === "pre_draw" && (
        <GroupDrawForm participants={participants} />
      )}

      {data.groups && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardHeader className="pb-1 pt-4">
              <span className="text-xs text-muted-foreground">Pendentes</span>
            </CardHeader>
            <CardContent>
              <span className="font-mono text-2xl font-bold">
                {data.pendingMatches}
              </span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-4">
              <span className="text-xs text-muted-foreground">Em andamento</span>
            </CardHeader>
            <CardContent>
              <span className="font-mono text-2xl font-bold text-live">
                {data.ongoingMatches}
              </span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-4">
              <span className="text-xs text-muted-foreground">Concluídas</span>
            </CardHeader>
            <CardContent>
              <span className="font-mono text-2xl font-bold">
                {data.completedMatches}
              </span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-4">
              <span className="text-xs text-muted-foreground">Grupos</span>
            </CardHeader>
            <CardContent>
              <span className="font-mono text-2xl font-bold">
                {data.groupCount}
              </span>
            </CardContent>
          </Card>
        </div>
      )}

      {data.recentResults.length > 0 && (
        <section>
          <h2 className="mb-3 font-heading text-lg font-semibold">
            Resultados recentes
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {data.recentResults.slice(0, 4).map((r) => (
              <MatchCard
                key={r.id}
                id={r.id}
                status={r.status}
                homeParticipantName={r.homeName}
                awayParticipantName={r.awayName}
                homeParticipantId=""
                awayParticipantId=""
                homeScore={r.homeScore}
                awayScore={r.awayScore}
              />
            ))}
          </div>
        </section>
      )}

      <Separator />

      <section>
        <h2 className="mb-3 font-heading text-lg font-semibold">Rankings</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <LeaderboardCard
            title="Gols"
            entries={data.leaderboards.goals}
            emptyMessage="Nenhum gol registrado."
          />
          <LeaderboardCard
            title="Assistências"
            entries={data.leaderboards.assists}
            emptyMessage="Nenhuma assistência registrada."
          />
          <LeaderboardCard
            title="Amarelos"
            entries={data.leaderboards.yellowCards}
            emptyMessage="Nenhum cartão amarelo."
          />
          <LeaderboardCard
            title="Vermelhos"
            entries={data.leaderboards.redCards}
            emptyMessage="Nenhum cartão vermelho."
          />
        </div>
      </section>
    </div>
  )
}
