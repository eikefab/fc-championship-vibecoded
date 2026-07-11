import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { FootballIcon } from "@hugeicons/core-free-icons"
import { NavLinks } from "./nav-links"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-card/95 backdrop-blur-md">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="group flex items-center gap-2.5 rounded-lg font-heading text-xl font-bold uppercase tracking-tight text-[#102a68]"
          >
            <span className="grid size-9 place-items-center rounded-lg bg-cobalt text-white shadow-sm transition-transform group-hover:-rotate-3">
              <HugeiconsIcon icon={FootballIcon} size={21} strokeWidth={2} />
            </span>
            <span className="hidden sm:inline">Campeonato <span className="text-cobalt">FC</span></span>
            <span className="sm:hidden">FC</span>
          </Link>
          <NavLinks />
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">{children}</main>
    </div>
  )
}
