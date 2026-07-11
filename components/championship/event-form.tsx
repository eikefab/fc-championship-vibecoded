"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { addEventAction, removeEventAction } from "@/app/actions/matches"
import { useActionFeedback } from "./action-feedback"

type PlayerOption = {
  id: string
  name: string
  participantId: string
  participantName: string
}

type EventEntry = {
  id: string
  playerName: string
  eventType: string
  participantName: string
}

const eventTypes = [
  { value: "GOAL", label: "Gol" },
  { value: "ASSIST", label: "Assistência" },
  { value: "YELLOW_CARD", label: "Amarelo" },
  { value: "RED_CARD", label: "Vermelho" },
]

const eventLabels: Record<string, string> = {
  GOAL: "Gol",
  ASSIST: "Assist",
  YELLOW_CARD: "Amarelo",
  RED_CARD: "Vermelho",
}

export function EventForm({
  matchId,
  players,
  events,
}: {
  matchId: string
  players: PlayerOption[]
  events: EventEntry[]
}) {
  const [addResult, addAction, addPending] = useActionState(
    addEventAction,
    null,
  )
  useActionFeedback(addResult)

  return (
    <Card>
      <CardHeader className="pb-3">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Eventos
        </h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <form action={addAction} className="space-y-3">
          <input type="hidden" name="matchId" value={matchId} />

          <Select name="playerId" required>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar jogador" />
            </SelectTrigger>
            <SelectContent>
              {players.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} ({p.participantName})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select name="eventType" required>
            <SelectTrigger>
              <SelectValue placeholder="Tipo de evento" />
            </SelectTrigger>
            <SelectContent>
              {eventTypes.map((et) => (
                <SelectItem key={et.value} value={et.value}>
                  {et.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {addResult && !addResult.ok && (
            <p className="text-sm text-destructive" role="alert">
              {addResult.error.message}
            </p>
          )}

          <Button type="submit" disabled={addPending} size="sm">
            {addPending ? <Spinner /> : null}
            Adicionar evento
          </Button>
        </form>

        {events.length > 0 && (
          <ul className="space-y-1">
            {events.map((event) => (
              <li
                key={event.id}
                className="flex items-center justify-between rounded border px-2 py-1 text-sm"
              >
                <span>
                  <span className="text-muted-foreground">
                    {eventLabels[event.eventType] ?? event.eventType}
                  </span>{" "}
                  {event.playerName}
                </span>
                <RemoveEventButton
                  eventId={event.id}
                  matchId={matchId}
                />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function RemoveEventButton({
  eventId,
  matchId,
}: {
  eventId: string
  matchId: string
}) {
  const [result, formAction, pending] = useActionState(
    removeEventAction,
    null,
  )
  useActionFeedback(result)

  return (
    <form action={formAction}>
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="matchId" value={matchId} />
      <Button
        type="submit"
        variant="ghost"
        size="xs"
        disabled={pending}
        className="h-6 px-1 text-xs text-muted-foreground hover:text-destructive"
      >
        {pending ? <Spinner /> : null}
        Remover
      </Button>
    </form>
  )
}
