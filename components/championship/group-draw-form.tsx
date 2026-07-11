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
    <Card>
      <CardHeader>
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Sortear grupos
        </h3>
        <p className="text-xs text-muted-foreground">
          Selecione exatamente 2 cabeças-de-chave ({seeds.length}/2)
        </p>
      </CardHeader>
      <CardContent>
        <form action={formAction}>
          <input type="hidden" name="seedA" value={seeds[0] ?? ""} />
          <input type="hidden" name="seedB" value={seeds[1] ?? ""} />

          <div className="mb-4 grid gap-2 sm:grid-cols-2">
            {participants.map((p) => (
              <label
                key={p.id}
                className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm hover:bg-muted/50"
              >
                <Checkbox
                  checked={seeds.includes(p.id)}
                  onCheckedChange={() => toggleSeed(p.id)}
                />
                {p.name}
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
            className="w-full"
          >
            {pending ? <Spinner className="mr-2" /> : null}
            Sortear grupos
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
