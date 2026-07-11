import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"

export default function NotFoundPage() {
  return (
    <div className="flex items-center justify-center py-16">
      <Card className="max-w-md">
        <CardContent className="space-y-4 pt-6 text-center">
          <h2 className="font-heading text-4xl font-bold text-muted-foreground">
            404
          </h2>
          <p className="text-sm text-muted-foreground">
            A página que você procura não existe ou foi removida.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
          >
            Voltar ao início
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
