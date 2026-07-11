import { getGroupsData } from "@/lib/championship/application/queries"
import { StandingsTable } from "@/components/championship/standings-table"
import { MatchCard } from "@/components/championship/match-card"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export default async function GroupsPage() {
  const groups = await getGroupsData()

  if (groups.length === 0) {
    return (
      <div className="py-12 text-center">
        <h1 className="mb-3 font-heading text-2xl font-bold">Grupos</h1>
        <p className="text-muted-foreground">
          Os grupos ainda não foram sorteados. Volte ao dashboard para
          selecionar dois cabeças-de-chave.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.id}>
          <h2 className="mb-4 font-heading text-xl font-bold">
            Grupo {group.code}
          </h2>

          <Card className="mb-6">
            <CardHeader className="pb-2">
              <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Classificação
              </h3>
            </CardHeader>
            <CardContent>
              <StandingsTable standings={group.standings} />
            </CardContent>
          </Card>

          {group.rounds.map((round) => (
            <div key={round.round} className="mb-4">
              <h4 className="mb-2 font-heading text-sm font-semibold text-muted-foreground">
                Rodada {round.round}
              </h4>
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
                  />
                ))}
              </div>
              <p className="mt-1 text-center text-xs text-muted-foreground">
                Folga: {round.byeParticipantName || "—"}
              </p>
            </div>
          ))}

          {group.tiebreaks.length > 0 && (
            <>
              <Separator className="my-4" />
              <Card className="border-amber-200 bg-amber-50/30">
                <CardHeader className="pb-2">
                  <h3 className="flex items-center gap-2 font-heading text-sm font-semibold uppercase tracking-wide">
                    Desempate do G4
                    <Badge variant="outline" className="border-amber-400 text-amber-700">
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
                                <Badge variant="secondary" className="ml-1 text-[10px]">
                                  {m.status}
                                </Badge>
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
      ))}
    </div>
  )
}
