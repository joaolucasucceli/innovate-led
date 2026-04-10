"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Kanban,
  UserSearch,
  Bot,
  FileBarChart,
} from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Menu } from "lucide-react"
import { useNaoLidas } from "@/hooks/use-nao-lidas"

interface NavItem {
  titulo: string
  href: string
  icone: React.ReactNode
}

const navItems: NavItem[] = [
  {
    titulo: "Dashboard",
    href: "/dashboard",
    icone: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    titulo: "Atendimentos",
    href: "/atendimentos",
    icone: <Kanban className="h-4 w-4" />,
  },
  {
    titulo: "Leads",
    href: "/leads",
    icone: <UserSearch className="h-4 w-4" />,
  },
  {
    titulo: "Agente IA",
    href: "/agente-ia",
    icone: <Bot className="h-4 w-4" />,
  },
  {
    titulo: "Relatorios",
    href: "/relatorios",
    icone: <FileBarChart className="h-4 w-4" />,
  },
]

function NavContent() {
  const pathname = usePathname()
  const naoLidas = useNaoLidas()

  return (
    <nav className="grid gap-1 p-2">
      {navItems.map((item) => {
        const ativo = pathname === item.href || pathname.startsWith(item.href + "/")
        const ehAtendimentos = item.href === "/atendimentos"
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              ativo
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            {item.icone}
            {item.titulo}
            {ehAtendimentos && naoLidas > 0 && (
              <Badge variant="default" className="ml-auto h-5 min-w-[20px] flex items-center justify-center text-[10px] px-1.5">
                {naoLidas > 99 ? "99+" : naoLidas}
              </Badge>
            )}
          </Link>
        )
      })}
    </nav>
  )
}

export function AppSidebar() {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r bg-muted/40 md:block">
        <div className="flex h-14 items-center border-b px-4">
          <span className="text-lg font-bold tracking-tight">Innovate</span>
        </div>
        <ScrollArea className="h-[calc(100svh-3.5rem)]">
          <NavContent />
        </ScrollArea>
      </aside>
    </>
  )
}

export function MobileSidebarTrigger() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetTitle className="flex h-14 items-center border-b px-4">
          <span className="text-lg font-bold tracking-tight">Innovate</span>
        </SheetTitle>
        <ScrollArea className="h-[calc(100svh-3.5rem)]">
          <NavContent />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
