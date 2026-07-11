import type { Metadata } from "next"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppShell } from "@/components/app-shell"
import "./globals.css"

export const metadata: Metadata = {
  title: "Campeonato FC",
  description:
    "Sistema de campeonato de futebol com 10 participantes, elencos fixos e mata-mata fase a fase.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>
        <TooltipProvider>
          <AppShell>{children}</AppShell>
        </TooltipProvider>
      </body>
    </html>
  )
}
