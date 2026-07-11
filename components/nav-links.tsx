"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { Chart01Icon, ChampionIcon, Home01Icon } from "@hugeicons/core-free-icons"

const links = [
  { href: "/", label: "Início", icon: Home01Icon },
  { href: "/grupos", label: "Grupos", icon: Chart01Icon },
  { href: "/mata-mata", label: "Mata-mata", icon: ChampionIcon },
]

export function NavLinks() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1 rounded-xl bg-muted/70 p-1" aria-label="Navegação principal">
      {links.map((link) => {
        const isActive = pathname === link.href
        return (
          <Link
            key={link.href}
            href={link.href}
            className="flex min-h-9 items-center gap-2 rounded-lg px-2.5 text-xs font-semibold transition-all hover:bg-white hover:text-cobalt aria-[current]:bg-white aria-[current]:text-cobalt aria-[current]:shadow-sm sm:px-3 sm:text-sm"
            aria-current={isActive ? "page" : undefined}
          >
            <HugeiconsIcon icon={link.icon} size={16} strokeWidth={2} />
            <span className={link.href === "/" ? "hidden sm:inline" : ""}>{link.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
