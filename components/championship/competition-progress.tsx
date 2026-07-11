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
      <ol className="grid grid-cols-4 overflow-hidden rounded-xl border border-white/15 bg-[#0d245b]/55 p-1.5 backdrop-blur-sm">
        {stages.map((stage, i) => {
          const isActive = i <= activeIndex
          const isCurrent = i === activeIndex
          return (
            <li key={stage.key} className="relative flex min-w-0 items-center">
              <span
                aria-current={isCurrent ? "step" : undefined}
                className={`relative z-10 flex min-h-11 w-full items-center justify-center rounded-lg px-2 font-heading text-xs font-semibold uppercase tracking-wide transition-colors sm:text-sm ${
                  isCurrent
                    ? "bg-white text-cobalt shadow-lg shadow-black/10"
                    : isActive
                      ? "text-white"
                      : "text-blue-200/70"
                }`}
              >
                <span className="mr-1.5 hidden font-mono text-[10px] opacity-60 sm:inline">0{i + 1}</span>
                {stage.label}
              </span>
              {i < stages.length - 1 ? <span className="absolute -right-1 z-20 size-2 rotate-45 border-r border-t border-white/20" aria-hidden /> : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
