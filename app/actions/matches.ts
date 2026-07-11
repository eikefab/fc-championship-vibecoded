"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import {
  startMatch,
  updateMatchScore,
  addMatchEvent,
  removeMatchEvent,
  completeMatch,
  correctMatch,
} from "@/lib/championship/application/match-service"
import { createGroupTiebreak } from "@/lib/championship/application/tiebreak-service"
import type { ActionResult } from "@/lib/championship/application/action-result"

export async function startMatchAction(
  _prev: ActionResult<unknown> | null,
  formData: FormData,
): Promise<ActionResult<unknown>> {
  const parsed = z
    .object({ matchId: z.string().min(1) })
    .safeParse({ matchId: formData.get("matchId") })

  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR" as const, message: "ID da partida inválido" },
    }
  }

  const result = await startMatch(parsed.data.matchId)

  if (result.ok) {
    revalidatePath(`/partidas/${parsed.data.matchId}`)
    revalidatePath("/")
    revalidatePath("/grupos")
  }

  return result
}

export async function updateScoreAction(
  _prev: ActionResult<unknown> | null,
  formData: FormData,
): Promise<ActionResult<unknown>> {
  const parsed = z
    .object({
      matchId: z.string().min(1),
      homeScore: z.coerce.number().int().min(0),
      awayScore: z.coerce.number().int().min(0),
    })
    .safeParse({
      matchId: formData.get("matchId"),
      homeScore: formData.get("homeScore"),
      awayScore: formData.get("awayScore"),
    })

  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR" as const,
        message: "Placar inválido",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      },
    }
  }

  const result = await updateMatchScore(
    parsed.data.matchId,
    parsed.data.homeScore,
    parsed.data.awayScore,
  )

  if (result.ok) {
    revalidatePath(`/partidas/${parsed.data.matchId}`)
    revalidatePath("/")
    revalidatePath("/grupos")
  }

  return result
}

export async function completeMatchAction(
  _prev: ActionResult<unknown> | null,
  formData: FormData,
): Promise<ActionResult<unknown>> {
  const parsed = z
    .object({ matchId: z.string().min(1) })
    .safeParse({ matchId: formData.get("matchId") })

  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR" as const, message: "ID inválido" },
    }
  }

  const result = await completeMatch(parsed.data.matchId)

  if (result.ok) {
    revalidatePath(`/partidas/${parsed.data.matchId}`)
    revalidatePath("/")
    revalidatePath("/grupos")
    revalidatePath("/mata-mata")
  }

  return result
}

export async function addEventAction(
  _prev: ActionResult<unknown> | null,
  formData: FormData,
): Promise<ActionResult<unknown>> {
  const parsed = z
    .object({
      matchId: z.string().min(1),
      playerId: z.string().min(1),
      eventType: z.enum(["GOAL", "ASSIST", "YELLOW_CARD", "RED_CARD"]),
    })
    .safeParse({
      matchId: formData.get("matchId"),
      playerId: formData.get("playerId"),
      eventType: formData.get("eventType"),
    })

  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR" as const,
        message: "Dados do evento inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      },
    }
  }

  const result = await addMatchEvent(
    parsed.data.matchId,
    parsed.data.playerId,
    parsed.data.eventType,
  )

  if (result.ok) {
    revalidatePath(`/partidas/${parsed.data.matchId}`)
    revalidatePath("/")
  }

  return result
}

export async function removeEventAction(
  _prev: ActionResult<unknown> | null,
  formData: FormData,
): Promise<ActionResult<unknown>> {
  const parsed = z
    .object({
      eventId: z.string().min(1),
      matchId: z.string().min(1),
    })
    .safeParse({
      eventId: formData.get("eventId"),
      matchId: formData.get("matchId"),
    })

  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR" as const, message: "ID inválido" },
    }
  }

  const result = await removeMatchEvent(parsed.data.eventId)

  if (result.ok) {
    revalidatePath(`/partidas/${parsed.data.matchId}`)
    revalidatePath("/")
  }

  return result
}

export async function correctMatchAction(
  _prev: ActionResult<unknown> | null,
  formData: FormData,
): Promise<ActionResult<unknown>> {
  const parsed = z
    .object({
      matchId: z.string().min(1),
      homeScore: z.coerce.number().int().min(0),
      awayScore: z.coerce.number().int().min(0),
      fingerprint: z.string().optional(),
    })
    .safeParse({
      matchId: formData.get("matchId"),
      homeScore: formData.get("homeScore"),
      awayScore: formData.get("awayScore"),
      fingerprint: formData.get("fingerprint"),
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

  const result = await correctMatch(
    parsed.data.matchId,
    parsed.data.homeScore,
    parsed.data.awayScore,
    undefined,
    undefined,
    parsed.data.fingerprint
      ? { fingerprint: parsed.data.fingerprint }
      : undefined,
  )

  if (result.ok) {
    revalidatePath(`/partidas/${parsed.data.matchId}`)
    revalidatePath("/")
    revalidatePath("/grupos")
    revalidatePath("/mata-mata")
  }

  return result
}

export async function createTiebreakAction(
  _prev: ActionResult<unknown> | null,
  formData: FormData,
): Promise<ActionResult<unknown>> {
  const parsed = z
    .object({ groupId: z.string().min(1) })
    .safeParse({ groupId: formData.get("groupId") })

  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR" as const, message: "ID do grupo inválido" },
    }
  }

  const result = await createGroupTiebreak(parsed.data.groupId)

  if (result.ok) {
    revalidatePath("/")
    revalidatePath("/grupos")
  }

  return result
}
