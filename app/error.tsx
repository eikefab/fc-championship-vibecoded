"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex items-center justify-center py-16">
      <Card className="surface-shadow w-full max-w-md border-0 ring-1 ring-[#102a68]/10">
        <CardContent className="space-y-4 py-8 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-destructive/10 font-heading text-xl font-bold text-destructive">!</span>
          <h2 className="font-heading text-2xl font-bold uppercase text-[#102a68]">
            Não foi possível carregar
          </h2>
          <p className="text-sm text-muted-foreground">
            Ocorreu um erro inesperado ao carregar a página. Tente novamente.
          </p>
          <Button onClick={reset} className="min-h-10 bg-cobalt px-5 font-semibold">
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
