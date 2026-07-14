export const dynamic = "force-dynamic"

import { getGroupsData } from "@/lib/championship/application/queries"
import { StandingsTable } from "@/components/championship/standings-table"
import { MatchCard } from "@/components/championship/match-card"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { PageHeading } from "@/components/championship/page-heading"

export default async function GroupsPage() {
  const groups = await getGroupsData()

  if (groups.length === 0) {
    return (
      <div className="surface-shadow rounded-2xl border border-dashed bg-card/70 px-6 py-16 text-center">
        <p className="mb-2 font-heading text-xs font-bold tracking-[0.2em] text-cobalt uppercase">
          Fase 01
        </p>
        <h1 className="mb-3 font-heading text-3xl font-bold text-[#102a68] uppercase">
          Grupos ainda não sorteados
        </h1>
        <p className="mx-auto max-w-lg text-sm leading-6 text-muted-foreground">
          Os grupos ainda não foram sorteados. Volte ao dashboard para
          selecionar dois cabeças-de-chave.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <PageHeading
        eyebrow="Fase 01"
        title="Fase de grupos"
        description="Classificação ao vivo, rodadas e resultados de cada grupo."
      />
      {groups.map((group) => {
        const matches = group.rounds.flatMap((round) => round.matches)
        const completed = matches.filter(
          (match) => match.status === "COMPLETED"
        ).length
        return (
          <section key={group.id} className="space-y-5">
            <div className="flex items-end justify-between border-b-2 border-[#102a68] pb-3">
              <div>
                <p className="text-[10px] font-bold tracking-[0.18em] text-cobalt uppercase">
                  Classificação e jogos
                </p>
                <h2 className="font-heading text-3xl leading-none font-bold text-[#102a68] uppercase">
                  Grupo {group.code}
                </h2>
              </div>
              <div className="text-right">
                <strong className="font-mono text-lg text-[#102a68]">
                  {completed}/{matches.length}
                </strong>
                <p className="text-[10px] tracking-wide text-muted-foreground uppercase">
                  partidas concluídas
                </p>
              </div>
            </div>

            <Card className="surface-shadow border-0 ring-1 ring-[#102a68]/10">
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-heading text-base font-bold tracking-wide text-[#102a68] uppercase">
                    Classificação
                  </h3>
                  <div className="flex flex-wrap justify-end gap-x-3 gap-y-1 text-[10px] font-medium text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-sm bg-qualification" /> G4
                      atual
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-sm bg-emerald-100" />{" "}
                      Classificado
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-sm bg-amber-100" />{" "}
                      Posição garantida
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <StandingsTable standings={group.standings} />
              </CardContent>
            </Card>

            <div className="grid gap-x-6 gap-y-5 lg:grid-cols-2">
              {group.rounds.map((round) => (
                <div
                  key={round.round}
                  className="rounded-xl border border-border/80 bg-white/40 p-3"
                >
                  <div className="mb-2.5 flex items-center justify-between">
                    <h3 className="font-heading text-base font-bold text-[#102a68] uppercase">
                      Rodada {round.round}
                    </h3>
                    <span className="rounded-full bg-muted px-2 py-1 text-[10px] text-muted-foreground">
                      Folga: {round.byeParticipantName || "—"}
                    </span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {round.matches.map((m) => (
                      <MatchCard
                        key={m.id}
                        id={m.id}
                        status={m.status}
                        homeParticipantId={m.homeParticipantId}
                        homeParticipantName={m.homeParticipantName}
                        awayParticipantId={m.awayParticipantId}
                        awayParticipantName={m.awayParticipantName}
                        homeScore={m.homeScore}
                        awayScore={m.awayScore}
                        walkoverWinnerId={m.walkoverWinnerId}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {group.tiebreaks.length > 0 && (
              <>
                <Separator className="my-4" />
                <Card className="border-amber-200 bg-amber-50/30">
                  <CardHeader className="pb-2">
                    <h3 className="flex items-center gap-2 font-heading text-sm font-semibold tracking-wide uppercase">
                      Desempate do G4
                      <Badge
                        variant="outline"
                        className="border-amber-400 text-amber-700"
                      >
                        Tentativa {group.tiebreaks[0].attempt}
                      </Badge>
                    </h3>
                  </CardHeader>
                  <CardContent>
                    {group.tiebreaks.map((tb) => (
                      <div key={tb.id}>
                        <p className="mb-2 text-sm text-muted-foreground">
                          {tb.participants
                            .map((p) => p.participantName)
                            .join(", ")}{" "}
                          — {tb.slotsAtStake} vaga(s) em disputa
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {tb.matches.map((m) => (
                            <Card key={m.id} className="bg-white">
                              <CardContent className="px-3 py-2">
                                <p className="text-center text-sm font-medium">
                                  Partida de desempate{" "}
                                  <Badge
                                    variant="secondary"
                                    className="ml-1 text-[10px]"
                                  >
                                    {m.status}
                                  </Badge>
                                  {m.walkoverWinnerId ? (
                                    <Badge variant="outline" className="ml-1 border-amber-400 text-[10px] text-amber-700">
                                      W.O.
                                    </Badge>
                                  ) : null}
                                </p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </>
            )}
          </section>
        )
      })}
    </div>
  )
}
