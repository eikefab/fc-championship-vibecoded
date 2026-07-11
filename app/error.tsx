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
      <Card className="max-w-md">
        <CardContent className="space-y-4 pt-6 text-center">
          <h2 className="font-heading text-lg font-bold">
            Algo deu errado
          </h2>
          <p className="text-sm text-muted-foreground">
            Ocorreu um erro inesperado ao carregar a página. Tente novamente.
          </p>
          <Button onClick={reset} variant="secondary">
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
