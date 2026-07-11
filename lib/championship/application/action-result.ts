import "server-only"
import type { DomainErrorCode } from "./errors"

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | {
      ok: false
      error: {
        code: DomainErrorCode
        message: string
        confirmation?: {
          fingerprint: string
          affectedStages: string[]
        }
        fieldErrors?: Record<string, string[]>
      }
    }

export function success<T>(data: T): ActionResult<T> {
  return { ok: true, data }
}

export function successEmpty(): ActionResult<void> {
  return { ok: true, data: undefined }
}

export function failure(
  code: DomainErrorCode,
  message: string,
  opts?: {
    confirmation?: { fingerprint: string; affectedStages: string[] }
    fieldErrors?: Record<string, string[]>
  },
): ActionResult<never> {
  return {
    ok: false,
    error: { code, message, ...opts },
  }
}
