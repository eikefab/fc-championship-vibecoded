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
    <form action={formAction}>
      <input type="hidden" name="matchId" value={matchId} />
      <Button type="submit" disabled={pending}>
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
    <Card>
      <CardHeader className="pb-3">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Placar
        </h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <form action={scoreAction} className="space-y-4">
          <input type="hidden" name="matchId" value={matchId} />
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-xs">Mandante</label>
              <Input
                type="number"
                name="homeScore"
                defaultValue={defaultHome}
                min={0}
                required
              />
            </div>
            <span className="pt-5 text-muted-foreground">×</span>
            <div className="flex-1">
              <label className="mb-1 block text-xs">Visitante</label>
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
            className="w-full"
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
            variant="secondary"
            disabled={completePending}
            className="w-full"
          >
            {completePending ? <Spinner /> : null}
            Concluir partida
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
