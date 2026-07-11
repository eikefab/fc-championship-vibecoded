"use client"

import { useActionState, useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { drawGroupsAction } from "@/app/actions/groups"
import { useActionFeedback } from "./action-feedback"
import type { ParticipantDto } from "@/lib/championship/domain"

export function GroupDrawForm({
  participants,
}: {
  participants: ParticipantDto[]
}) {
  const [seeds, setSeeds] = useState<string[]>([])
  const [result, formAction, pending] = useActionState(
    drawGroupsAction,
    null,
  )

  useActionFeedback(result, "Grupos sorteados com sucesso")

  function toggleSeed(id: string) {
    setSeeds((prev) =>
      prev.includes(id)
        ? prev.filter((s) => s !== id)
        : prev.length < 2
          ? [...prev, id]
          : prev,
    )
  }

  return (
    <Card className="surface-shadow overflow-hidden border-0 ring-1 ring-[#102a68]/10">
      <CardHeader className="border-b bg-[#102a68] py-5 text-white">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-xl font-bold uppercase tracking-tight">Defina os cabeças-de-chave</h2>
            <p className="mt-1 text-xs text-blue-100/75">Escolha dois participantes antes de sortear os grupos.</p>
          </div>
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-white/10 font-mono text-sm font-bold" aria-label={`${seeds.length} de 2 selecionados`}>
            {seeds.length}/2
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-5">
        <form action={formAction}>
          <input type="hidden" name="seedA" value={seeds[0] ?? ""} />
          <input type="hidden" name="seedB" value={seeds[1] ?? ""} />

          <div className="mb-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {participants.map((p) => (
              <label
                key={p.id}
                className={`relative flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm font-medium transition-all hover:border-cobalt/40 hover:bg-accent/50 ${seeds.includes(p.id) ? "border-cobalt bg-accent text-[#102a68] ring-1 ring-cobalt/20" : "bg-white"}`}
              >
                <Checkbox
                  checked={seeds.includes(p.id)}
                  onCheckedChange={() => toggleSeed(p.id)}
                />
                <span>{p.name}</span>
                {seeds.includes(p.id) ? (
                  <span className="ml-auto grid size-5 place-items-center rounded-full bg-cobalt font-mono text-[10px] font-bold text-white">
                    {seeds.indexOf(p.id) + 1}
                  </span>
                ) : null}
              </label>
            ))}
          </div>

          {result && !result.ok && (
            <p className="mb-3 text-sm text-destructive" role="alert">
              {result.error.message}
            </p>
          )}

          <Button
            type="submit"
            disabled={pending || seeds.length !== 2}
            className="min-h-11 w-full bg-cobalt font-semibold shadow-sm hover:bg-[#102a68]"
          >
            {pending ? <Spinner className="mr-2" /> : null}
            Sortear grupos
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
