"use client"

import { useActionState, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

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

const eventStyles: Record<string, string> = {
  GOAL: "bg-blue-50 text-cobalt",
  ASSIST: "bg-emerald-50 text-[#16845b]",
  YELLOW_CARD: "bg-amber-50 text-amber-700",
  RED_CARD: "bg-red-50 text-red-700",
}

function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
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
    null
  )
  const [playerSearch, setPlayerSearch] = useState("")
  useActionFeedback(addResult)

  const normalizedSearch = normalizeSearch(playerSearch.trim())
  const filteredPlayers = normalizedSearch
    ? players.filter((player) =>
        normalizeSearch(`${player.name} ${player.participantName}`).includes(
          normalizedSearch
        )
      )
    : players
  const playerSelectItems = players.map((player) => ({
    value: player.id,
    label: `${player.name} (${player.participantName})`,
  }))

  return (
    <Card className="surface-shadow border-0 ring-1 ring-[#102a68]/10">
      <CardHeader className="pb-3">
        <h3 className="font-heading text-base font-bold tracking-wide text-[#102a68] uppercase">
          Eventos
        </h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <form action={addAction} className="space-y-3">
          <input type="hidden" name="matchId" value={matchId} />

          <div>
            <label
              htmlFor="player-search"
              className="mb-1.5 block text-xs font-medium text-muted-foreground"
            >
              Buscar jogador
            </label>
            <div className="relative">
              <HugeiconsIcon
                icon={Search01Icon}
                size={16}
                strokeWidth={2}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="player-search"
                type="search"
                value={playerSearch}
                onChange={(event) => setPlayerSearch(event.target.value)}
                placeholder="Nome do jogador ou participante"
                autoComplete="off"
                className="h-10 bg-white pl-9"
              />
            </div>
            <p
              className="mt-1.5 text-[10px] text-muted-foreground"
              aria-live="polite"
            >
              {filteredPlayers.length}{" "}
              {filteredPlayers.length === 1
                ? "jogador encontrado"
                : "jogadores encontrados"}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              name="playerId"
              items={playerSelectItems}
              required
              disabled={filteredPlayers.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecionar jogador" />
              </SelectTrigger>
              <SelectContent>
                {filteredPlayers.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.participantName})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select name="eventType" items={eventTypes} required>
              <SelectTrigger className="w-full">
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
          </div>

          {filteredPlayers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum jogador corresponde à busca. Tente outro nome.
            </p>
          ) : null}

          {addResult && !addResult.ok && (
            <p className="text-sm text-destructive" role="alert">
              {addResult.error.message}
            </p>
          )}

          <Button
            type="submit"
            disabled={addPending}
            className="min-h-10 w-full bg-cobalt font-semibold"
          >
            {addPending ? <Spinner /> : null}
            Adicionar evento
          </Button>
        </form>

        {events.length > 0 && (
          <ul className="space-y-2 border-t pt-4">
            {events.map((event) => (
              <li
                key={event.id}
                className="flex items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm"
              >
                <span>
                  <span
                    className={`mr-2 inline-flex rounded-md px-2 py-1 text-[10px] font-bold uppercase ${eventStyles[event.eventType] ?? "bg-muted text-muted-foreground"}`}
                  >
                    {eventLabels[event.eventType] ?? event.eventType}
                  </span>{" "}
                  {event.playerName}
                </span>
                <RemoveEventButton eventId={event.id} matchId={matchId} />
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
  const [result, formAction, pending] = useActionState(removeEventAction, null)
  useActionFeedback(result)

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="h-7 text-xs text-muted-foreground hover:text-destructive"
          />
        }
      >
        Remover
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover este evento?</AlertDialogTitle>
          <AlertDialogDescription>
            O ranking e a súmula serão recalculados após a remoção.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <form action={formAction}>
            <input type="hidden" name="eventId" value={eventId} />
            <input type="hidden" name="matchId" value={matchId} />
            <AlertDialogAction
              type="submit"
              disabled={pending}
              variant="destructive"
              className="w-full"
            >
              {pending ? <Spinner /> : null}
              Confirmar remoção
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
