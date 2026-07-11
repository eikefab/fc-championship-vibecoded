import type { ComponentProps } from "react"

const stages = [
  { key: "groups", label: "Grupos" },
  { key: "quarters", label: "Quartas" },
  { key: "semis", label: "Semifinais" },
  { key: "final", label: "Final" },
] as const

type StageKey = (typeof stages)[number]["key"]

const activeStage: Record<string, StageKey> = {
  pre_draw: "groups",
  groups: "groups",
  tiebreak: "groups",
  knockout: "quarters",
  completed: "final",
}

export function CompetitionProgress({
  phase,
  className,
  ...props
}: {
  phase: string
} & ComponentProps<"div">) {
  const activeIndex = stages.findIndex(
    (s) => s.key === (activeStage[phase] ?? "groups"),
  )

  return (
    <nav
      aria-label="Progresso do campeonato"
      className={className}
      {...props}
    >
      <ol className="flex items-center gap-1">
        {stages.map((stage, i) => {
          const isActive = i <= activeIndex
          const isCurrent = i === activeIndex
          return (
            <li key={stage.key} className="flex items-center gap-1">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold font-heading ${
                  isCurrent
                    ? "bg-cobalt text-cobalt-foreground"
                    : isActive
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {stage.label}
              </span>
              {i < stages.length - 1 && (
                <span className="h-px w-4 bg-border" aria-hidden />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
