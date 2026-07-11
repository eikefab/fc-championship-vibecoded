"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import {
  startMatchAction,
  updateScoreAction,
  completeMatchAction,
} from "@/app/actions/matches"
import { useActionFeedback } from "./action-feedback"

export function MatchControls({
  matchId,
  status,
  homeScore: currentHome,
  awayScore: currentAway,
}: {
  matchId: string
  status: string
  homeScore: number | null
  awayScore: number | null
}) {
  if (status === "PENDING") {
    return <StartMatchButton matchId={matchId} />
  }

  if (status === "ONGOING") {
    return (
      <ScoreForm
        matchId={matchId}
        defaultHome={currentHome ?? 0}
        defaultAway={currentAway ?? 0}
      />
    )
  }

  return null
}

function StartMatchButton({ matchId }: { matchId: string }) {
  const [result, formAction, pending] = useActionState(
    startMatchAction,
    null,
  )
  useActionFeedback(result, "Partida iniciada")

  return (
    <form action={formAction} className="rounded-xl border border-dashed bg-card p-5">
      <input type="hidden" name="matchId" value={matchId} />
      <p className="mb-3 text-sm text-muted-foreground">A partida está pronta. Inicie para liberar o placar e os eventos.</p>
      <Button type="submit" disabled={pending} className="min-h-10 w-full bg-cobalt font-semibold">
        {pending ? <Spinner /> : null}
        Iniciar partida
      </Button>
    </form>
  )
}

function ScoreForm({
  matchId,
  defaultHome,
  defaultAway,
}: {
  matchId: string
  defaultHome: number
  defaultAway: number
}) {
  const [scoreResult, scoreAction, scorePending] = useActionState(
    updateScoreAction,
    null,
  )
  const [completeResult, completeAction, completePending] =
    useActionState(completeMatchAction, null)

  useActionFeedback(scoreResult, "Placar atualizado")
  useActionFeedback(completeResult, "Partida concluída")

  return (
    <Card className="surface-shadow border-0 ring-1 ring-[#102a68]/10">
      <CardHeader className="pb-3">
        <h3 className="font-heading text-base font-bold uppercase tracking-wide text-[#102a68]">
          Controle do placar
        </h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <form action={scoreAction} className="space-y-4">
          <input type="hidden" name="matchId" value={matchId} />
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Mandante</label>
              <Input
                type="number"
                name="homeScore"
                defaultValue={defaultHome}
                min={0}
                required
              />
            </div>
            <span className="pt-5 font-heading text-lg text-muted-foreground">×</span>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Visitante</label>
              <Input
                type="number"
                name="awayScore"
                defaultValue={defaultAway}
                min={0}
                required
              />
            </div>
          </div>

          {scoreResult && !scoreResult.ok && (
            <p className="text-sm text-destructive" role="alert">
              {scoreResult.error.message}
            </p>
          )}

          <Button
            type="submit"
            disabled={scorePending}
            className="min-h-10 w-full bg-cobalt font-semibold"
          >
            {scorePending ? <Spinner /> : null}
            Salvar placar
          </Button>
        </form>

        <form action={completeAction}>
          <input type="hidden" name="matchId" value={matchId} />
          {completeResult && !completeResult.ok && (
            <p className="mb-2 text-sm text-destructive" role="alert">
              {completeResult.error.message}
            </p>
          )}
          <Button
            type="submit"
            variant="outline"
            disabled={completePending}
            className="min-h-10 w-full font-semibold text-[#16845b]"
          >
            {completePending ? <Spinner /> : null}
            Concluir partida
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
