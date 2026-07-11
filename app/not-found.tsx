import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"

export default function NotFoundPage() {
  return (
    <div className="flex items-center justify-center py-16">
      <Card className="score-grid w-full max-w-md border-0 bg-[#102a68] text-white shadow-xl shadow-[#102a68]/15">
        <CardContent className="space-y-4 py-9 text-center">
          <h2 className="font-heading text-6xl font-bold text-white">
            404
          </h2>
          <p className="text-sm text-blue-100/75">
            A página que você procura não existe ou foi removida.
          </p>
          <Link
            href="/"
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#102a68] transition-colors hover:bg-blue-50"
          >
            Voltar ao início
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
