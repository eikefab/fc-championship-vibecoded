export const dynamic = "force-dynamic"

import { getKnockoutData } from "@/lib/championship/application/queries"
import { KnockoutBracket } from "@/components/championship/knockout-bracket"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CompetitionProgress } from "@/components/championship/competition-progress"

export default async function KnockoutPage() {
  const data = await getKnockoutData()

  return (
    <div className="space-y-7">
      <section className="score-grid overflow-hidden rounded-2xl bg-[#102a68] p-6 text-white shadow-xl shadow-[#102a68]/15 sm:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-200">Fase eliminatória</p>
        <div className="mt-2 grid gap-6 lg:grid-cols-[1fr_2fr] lg:items-end">
          <div>
            <h1 className="font-heading text-4xl font-bold uppercase leading-none sm:text-5xl">Mata-mata</h1>
            <p className="mt-2 text-sm text-blue-100/75">Um caminho. Oito classificados. Um campeão.</p>
          </div>
          <CompetitionProgress phase="knockout" />
        </div>
      </section>

      {data.quarters.length === 0 &&
      data.semis.length === 0 &&
      data.final.length === 0 && (
        <Alert className="border-dashed bg-card/70 py-6">
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

      <p className="text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:hidden">Deslize para acompanhar toda a chave →</p>
    </div>
  )
}
