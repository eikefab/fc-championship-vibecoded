import { getDashboardData } from "@/lib/championship/application/queries"
import prisma from "@/lib/prisma"
import { CompetitionProgress } from "@/components/championship/competition-progress"
import { GroupDrawForm } from "@/components/championship/group-draw-form"
import { LeaderboardCard } from "@/components/championship/leaderboard-card"
import { MatchCard } from "@/components/championship/match-card"
import { Card, CardContent } from "@/components/ui/card"
import { SectionHeading } from "@/components/championship/page-heading"
import { DevelopmentPhaseSimulator } from "@/components/championship/development-phase-simulator"

export default async function HomePage() {
  const data = await getDashboardData()

  const participants = data.phase === "pre_draw"
    ? await prisma.participant.findMany({
        select: { id: true, name: true },
      })
    : []

  const allRankingsEmpty = Object.values(data.leaderboards).every(
    (entries) => entries.length === 0,
  )

  const phaseLabels: Record<string, string> = {
    pre_draw: "Preparação",
    groups: "Fase de grupos",
    tiebreak: "Desempate do G4",
    knockout: "Mata-mata",
    completed: "Campeonato encerrado",
  }
  const isDevelopment = process.env.NODE_ENV === "development"

  return (
    <div className="space-y-8">
      <section className="score-grid relative overflow-hidden rounded-2xl bg-[#102a68] px-5 py-6 text-white shadow-xl shadow-[#102a68]/15 sm:px-8 sm:py-8">
        <div className="absolute -right-12 -top-20 size-64 rounded-full border-[36px] border-white/5" aria-hidden />
        <div className="relative">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-200">Central do campeonato</p>
          <div className="mt-2 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-heading text-4xl font-bold uppercase leading-none tracking-tight sm:text-5xl">
                  {phaseLabels[data.phase] ?? "Campeonato FC"}
                </h1>
                {isDevelopment ? (
                  <DevelopmentPhaseSimulator disabled={data.phase === "pre_draw" || data.phase === "completed"} />
                ) : null}
              </div>
              <p className="mt-2 max-w-lg text-sm text-blue-100/80">
                Acompanhe partidas, classificação e o caminho até a grande final.
              </p>
            </div>
            <CompetitionProgress phase={data.phase} className="w-full lg:max-w-2xl" />
          </div>
        </div>
      </section>

      {data.phase === "pre_draw" && (
        <GroupDrawForm participants={participants} />
      )}

      {data.groups ? (
        <div className="surface-shadow grid overflow-hidden rounded-xl border bg-card sm:grid-cols-4">
          {[
            ["Pendentes", data.pendingMatches, "border-l-slate-400", "text-foreground"],
            ["Em andamento", data.ongoingMatches, "border-l-[#e9a23b]", "text-[#a15c00]"],
            ["Concluídas", data.completedMatches, "border-l-[#16845b]", "text-[#16845b]"],
            ["Grupos", data.groupCount, "border-l-[#1746c7]", "text-cobalt"],
          ].map(([label, value, accent, tone]) => (
            <div key={String(label)} className={`flex items-center justify-between border-l-4 p-4 sm:block sm:border-b-0 sm:border-r ${accent}`}>
              <span className="text-xs font-medium text-muted-foreground">{label}</span>
              <strong className={`font-heading text-3xl font-bold tabular-nums sm:mt-1 sm:block ${tone}`}>{value}</strong>
            </div>
          ))}
        </div>
      ) : null}

      {data.recentResults.length > 0 && (
        <section>
          <SectionHeading title="Resultados recentes" description="Últimos placares confirmados" />
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

      <section>
        <SectionHeading title="Rankings" description="Destaques individuais do campeonato" />
        {allRankingsEmpty ? (
          <Card className="border-dashed bg-card/60">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <span className="mb-3 grid size-10 place-items-center rounded-full bg-muted font-heading text-lg font-bold text-muted-foreground">0</span>
              <p className="font-medium">Os rankings começam com os primeiros eventos</p>
              <p className="mt-1 text-xs text-muted-foreground">Gols, assistências e cartões aparecerão aqui.</p>
            </CardContent>
          </Card>
        ) : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        </div>}
      </section>
    </div>
  )
}
