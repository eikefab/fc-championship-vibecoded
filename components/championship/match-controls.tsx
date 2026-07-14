"use client"

import { useActionState, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import {
  startMatchAction,
  updateScoreAction,
  completeMatchAction,
  declareWalkoverAction,
  correctWalkoverAction,
} from "@/app/actions/matches"
import { useActionFeedback } from "./action-feedback"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function MatchControls({
  matchId,
  status,
  homeScore: currentHome,
  awayScore: currentAway,
  homeParticipantId,
  homeParticipantName,
  awayParticipantId,
  awayParticipantName,
  walkoverWinnerId,
}: {
  matchId: string
  status: string
  homeScore: number | null
  awayScore: number | null
  homeParticipantId: string
  homeParticipantName: string
  awayParticipantId: string
  awayParticipantName: string
  walkoverWinnerId: string | null
}) {
  if (status === "PENDING") {
    return (
      <div className="space-y-3">
        <StartMatchButton matchId={matchId} />
        <WalkoverButton
          matchId={matchId}
          homeParticipantId={homeParticipantId}
          homeParticipantName={homeParticipantName}
          awayParticipantId={awayParticipantId}
          awayParticipantName={awayParticipantName}
        />
      </div>
    )
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

  if (status === "COMPLETED" && walkoverWinnerId) {
    return (
      <WalkoverCorrection
        matchId={matchId}
        currentWinnerId={walkoverWinnerId}
        homeParticipantId={homeParticipantId}
        homeParticipantName={homeParticipantName}
        awayParticipantId={awayParticipantId}
        awayParticipantName={awayParticipantName}
      />
    )
  }

  return null
}

function WalkoverButton({
  matchId,
  homeParticipantId,
  homeParticipantName,
  awayParticipantId,
  awayParticipantName,
}: {
  matchId: string
  homeParticipantId: string
  homeParticipantName: string
  awayParticipantId: string
  awayParticipantName: string
}) {
  const [winnerId, setWinnerId] = useState(homeParticipantId)
  const [result, formAction, pending] = useActionState(declareWalkoverAction, null)
  useActionFeedback(result, "W.O. registrado")

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button type="button" variant="outline" className="min-h-10 w-full font-semibold text-[#8a4e00]" />}
      >
        Definir W.O.
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Registrar vitória por W.O.?</AlertDialogTitle>
          <AlertDialogDescription>
            Escolha o vencedor. A partida será concluída sem placar ou gols fictícios.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="matchId" value={matchId} />
          <input type="hidden" name="winnerParticipantId" value={winnerId} />
          {[{ id: homeParticipantId, name: homeParticipantName }, { id: awayParticipantId, name: awayParticipantName }].map((participant) => (
            <label key={participant.id} className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm font-semibold has-checked:border-cobalt has-checked:bg-accent">
              <input
                type="radio"
                name="winner"
                checked={winnerId === participant.id}
                onChange={() => setWinnerId(participant.id)}
                className="accent-cobalt"
              />
              {participant.name}
            </label>
          ))}
          {result && !result.ok ? <p className="text-sm text-destructive" role="alert">{result.error.message}</p> : null}
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
            <Button type="submit" disabled={pending} className="bg-cobalt">
              {pending ? <Spinner /> : null} Confirmar W.O.
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function WalkoverCorrection({
  matchId,
  currentWinnerId,
  homeParticipantId,
  homeParticipantName,
  awayParticipantId,
  awayParticipantName,
}: {
  matchId: string
  currentWinnerId: string
  homeParticipantId: string
  homeParticipantName: string
  awayParticipantId: string
  awayParticipantName: string
}) {
  const [winnerId, setWinnerId] = useState(currentWinnerId)
  const [remove, setRemove] = useState(false)
  const [result, formAction, pending] = useActionState(correctWalkoverAction, null)
  useActionFeedback(result, "W.O. corrigido")
  const confirmation = result && !result.ok ? result.error.confirmation : undefined
  const affectedStages = confirmation?.affectedStages ?? []
  const stageLabels: Record<string, string> = {
    GROUP_TIEBREAK: "desempate do G4",
    QUARTER_FINALS: "quartas de final",
    SEMI_FINALS: "semifinais",
    FINAL: "final",
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button type="button" variant="outline" className="min-h-10 w-full font-semibold" />}
      >
        Corrigir W.O.
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Corrigir resultado por W.O.</AlertDialogTitle>
          <AlertDialogDescription>
            Troque o vencedor ou remova o W.O. para devolver a partida ao calendário.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="matchId" value={matchId} />
          <input type="hidden" name="winnerParticipantId" value={remove ? "" : winnerId} />
          {confirmation?.fingerprint ? <input type="hidden" name="fingerprint" value={confirmation.fingerprint} /> : null}
          {[{ id: homeParticipantId, name: homeParticipantName }, { id: awayParticipantId, name: awayParticipantName }].map((participant) => (
            <label key={participant.id} className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm font-semibold has-checked:border-cobalt has-checked:bg-accent">
              <input type="radio" name="winner" checked={!remove && winnerId === participant.id} onChange={() => { setRemove(false); setWinnerId(participant.id) }} className="accent-cobalt" />
              {participant.name}
            </label>
          ))}
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed p-3 text-sm">
            <input type="checkbox" checked={remove} onChange={(event) => setRemove(event.target.checked)} className="accent-cobalt" />
            Remover W.O. e voltar para pendente
          </label>
          {affectedStages.length > 0 ? <p className="rounded-md bg-amber-50 p-3 text-xs text-amber-800">A correção apagará: {affectedStages.map((stage) => stageLabels[stage] ?? stage).join(", ")}.</p> : null}
          {result && !result.ok && !confirmation ? <p className="text-sm text-destructive" role="alert">{result.error.message}</p> : null}
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
            <Button type="submit" disabled={pending} className="bg-cobalt">
              {pending ? <Spinner /> : null} {confirmation ? "Confirmar correção" : "Revisar correção"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
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
