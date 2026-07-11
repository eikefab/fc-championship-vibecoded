import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <header className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-cobalt">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-heading text-3xl font-bold uppercase leading-none tracking-tight text-[#102a68] sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </header>
  )
}

export function SectionHeading({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4 border-b border-border/80 pb-2.5">
      <div>
        <h2 className="font-heading text-xl font-bold uppercase tracking-tight text-[#102a68]">
          {title}
        </h2>
        {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}
