"use server"

import { revalidatePath } from "next/cache"
import type { ActionResult } from "@/lib/championship/application/action-result"
import { simulateCurrentPhase } from "@/lib/championship/application/development-service"

export async function simulateCurrentPhaseAction(
  _previous: ActionResult<unknown> | null,
): Promise<ActionResult<unknown>> {
  void _previous
  if (process.env.NODE_ENV !== "development") {
    return {
      ok: false,
      error: {
        code: "STATE_CONFLICT",
        message: "Simulação disponível apenas em desenvolvimento",
      },
    }
  }

  const result = await simulateCurrentPhase()

  if (result.ok) {
    revalidatePath("/")
    revalidatePath("/grupos")
    revalidatePath("/mata-mata")
  }

  return result
}
