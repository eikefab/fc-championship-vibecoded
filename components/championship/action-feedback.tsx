"use client"

import { useEffect } from "react"
import { toast } from "sonner"
import type { ActionResult } from "@/lib/championship/application/action-result"

export function useActionFeedback(
  result: ActionResult<unknown> | null,
  successMessage?: string,
) {
  useEffect(() => {
    if (!result) return
    if (result.ok) {
      if (successMessage) toast.success(successMessage)
    } else {
      toast.error(result.error.message)
    }
  }, [result, successMessage])
}
