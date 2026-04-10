"use client"

import { Monitor } from "lucide-react"
import { AppSidebar, MobileSidebarTrigger } from "@/components/features/shared/AppSidebar"

interface DashboardShellProps {
  nome: string
  email: string
  perfil: string
  children: React.ReactNode
}

export function DashboardShell({
  children,
}: DashboardShellProps) {
  return (
    <div className="flex min-h-svh">
      <AppSidebar />
      <main className="flex-1 min-w-0 overflow-hidden">
        <div className="flex h-14 items-center border-b px-4 md:hidden">
          <MobileSidebarTrigger />
          <Monitor className="ml-2 h-5 w-5 text-primary" />
          <span className="ml-1 text-lg font-bold tracking-tight">Innovate</span>
        </div>
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  )
}
