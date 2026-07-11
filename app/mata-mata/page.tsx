import { getKnockoutData } from "@/lib/championship/application/queries"
import { KnockoutBracket } from "@/components/championship/knockout-bracket"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default async function KnockoutPage() {
  const data = await getKnockoutData()

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Mata-mata</h1>

      {data.quarters.length === 0 &&
      data.semis.length === 0 &&
      data.final.length === 0 && (
        <Alert>
          <AlertDescription>
            O mata-mata ainda não foi sorteado. Conclua a fase de grupos e
            desempates para sortear as quartas de final.
          </AlertDescription>
        </Alert>
      )}

      <KnockoutBracket
        quarters={data.quarters}
        semis={data.semis}
        final={data.final}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-4">
            <h3 className="mb-1 font-heading text-sm font-semibold">Quartas</h3>
            <p className="text-sm text-muted-foreground">
              {data.quarters.length > 0
                ? `${data.quarters.length} partidas sorteadas`
                : "Aguardando fase de grupos e desempates"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <h3 className="mb-1 font-heading text-sm font-semibold">Semifinais</h3>
            <p className="text-sm text-muted-foreground">
              {data.semis.length > 0
                ? `${data.semis.length} partidas sorteadas`
                : "Aguardando conclusão das quartas"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
