import { notFound } from "next/navigation"
import { getMatchData } from "@/lib/championship/application/queries"
import { MatchSheet } from "@/components/championship/match-sheet"

export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const match = await getMatchData(id)

  if (!match) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Súmula</h1>
      <MatchSheet match={match} />
    </div>
  )
}
