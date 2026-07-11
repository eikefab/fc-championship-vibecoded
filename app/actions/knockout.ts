"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import {
  drawKnockoutStage,
  redrawKnockoutStage,
} from "@/lib/championship/application/knockout-service"
import type { ActionResult } from "@/lib/championship/application/action-result"

export async function drawKnockoutAction(
  _prev: ActionResult<unknown> | null,
  formData: FormData,
): Promise<ActionResult<unknown>> {
  const parsed = z
    .object({ stage: z.enum(["QUARTER_FINALS", "SEMI_FINALS"]) })
    .safeParse({ stage: formData.get("stage") })

  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR" as const, message: "Fase inválida" },
    }
  }

  const result = await drawKnockoutStage(parsed.data.stage)

  if (result.ok) {
    revalidatePath("/")
    revalidatePath("/mata-mata")
  }

  return result
}

export async function redrawKnockoutAction(
  _prev: ActionResult<unknown> | null,
  formData: FormData,
): Promise<ActionResult<unknown>> {
  const parsed = z
    .object({
      stage: z.enum(["QUARTER_FINALS", "SEMI_FINALS"]),
      confirmation: z.coerce.boolean(),
    })
    .safeParse({
      stage: formData.get("stage"),
      confirmation: formData.get("confirmation"),
    })

  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR" as const, message: "Dados inválidos" },
    }
  }

  const result = await redrawKnockoutStage(
    parsed.data.stage,
    parsed.data.confirmation,
  )

  if (result.ok) {
    revalidatePath("/")
    revalidatePath("/mata-mata")
  }

  return result
}
