"use client"

import { useActionState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { PlayIcon } from "@hugeicons/core-free-icons"
import { simulateCurrentPhaseAction } from "@/app/actions/development"
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
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useActionFeedback } from "./action-feedback"

export function DevelopmentPhaseSimulator({
  disabled,
}: {
  disabled: boolean
}) {
  const [result, action, pending] = useActionState(
    simulateCurrentPhaseAction,
    null,
  )

  useActionFeedback(result, "Fase simulada com sucesso")

  return (
    <AlertDialog>
      <AlertDialogTrigger
        disabled={disabled}
        render={
          <Button
            type="button"
            variant="outline"
            className="min-h-9 border-white/25 bg-white/10 px-3 text-white hover:bg-white/20 hover:text-white disabled:opacity-40"
          />
        }
      >
        <HugeiconsIcon icon={PlayIcon} size={15} strokeWidth={2} />
        Simular fase atual
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Simular a fase atual?</AlertDialogTitle>
          <AlertDialogDescription>
            Todas as partidas pendentes desta fase receberão placares aleatórios
            e serão concluídas. Esta ação altera os dados locais de desenvolvimento.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <form action={action}>
            <AlertDialogAction
              type="submit"
              disabled={pending}
              className="w-full bg-cobalt"
            >
              {pending ? <Spinner /> : null}
              Simular fase
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
