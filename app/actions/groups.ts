"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { drawGroups, redrawGroups } from "@/lib/championship/application/group-service"
import type { ActionResult } from "@/lib/championship/application/action-result"

const drawSchema = z.object({
  seedA: z.string().min(1),
  seedB: z.string().min(1),
})

export async function drawGroupsAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult<unknown>> {
  const parsed = drawSchema.safeParse({
    seedA: formData.get("seedA"),
    seedB: formData.get("seedB"),
  })

  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR" as const,
        message: "Dados inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      },
    }
  }

  const result = await drawGroups([parsed.data.seedA, parsed.data.seedB])

  if (result.ok) {
    revalidatePath("/")
    revalidatePath("/grupos")
  }

  return result
}

export async function redrawGroupsAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult<unknown>> {
  const parsed = z
    .object({
      seedA: z.string().min(1),
      seedB: z.string().min(1),
      confirmation: z.coerce.boolean(),
    })
    .safeParse({
      seedA: formData.get("seedA"),
      seedB: formData.get("seedB"),
      confirmation: formData.get("confirmation"),
    })

  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR" as const,
        message: "Dados inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      },
    }
  }

  const result = await redrawGroups(
    [parsed.data.seedA, parsed.data.seedB],
    parsed.data.confirmation,
  )

  if (result.ok) {
    revalidatePath("/")
    revalidatePath("/grupos")
  }

  return result
}
