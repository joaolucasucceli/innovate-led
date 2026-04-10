"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard,
  Kanban,
  UserSearch,
  Bot,
  FileBarChart,
  BookOpen,
  ClipboardList,
  Settings,
  LogOut,
  Menu,
} from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useNaoLidas } from "@/hooks/use-nao-lidas"
import { ThemeToggle } from "@/components/features/shared/ThemeToggle"

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
  {
    titulo: "Base de Conhecimento",
    href: "/base-conhecimento",
    icone: <BookOpen className="h-4 w-4" />,
  },
  {
    titulo: "Solicitacoes",
    href: "/solicitacoes",
    icone: <ClipboardList className="h-4 w-4" />,
  },
  {
    titulo: "Configuracoes",
    href: "/configuracoes",
    icone: <Settings className="h-4 w-4" />,
  },
]

function NavContent() {
  const pathname = usePathname()
  const naoLidas = useNaoLidas()

  return (
    <div className="flex h-full flex-col">
      <div className="px-3 pt-3 pb-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Menu</p>
      </div>
      <nav className="grid gap-0.5 px-2">
        {navItems.map((item) => {
          const ativo = pathname === item.href || pathname.startsWith(item.href + "/")
          const ehAtendimentos = item.href === "/atendimentos"
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
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

      <div className="mt-auto px-2 pb-3">
        <div className="flex items-center justify-between px-3 py-1.5">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 text-sm font-medium text-destructive hover:text-destructive/80 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}

export function AppSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-muted/40 md:block">
      <div className="flex h-14 items-center border-b px-4">
        <span className="text-lg font-bold tracking-tight">Innovate</span>
      </div>
      <div className="h-[calc(100svh-3.5rem)]">
        <NavContent />
      </div>
    </aside>
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
        <div className="h-[calc(100svh-3.5rem)]">
          <NavContent />
        </div>
      </SheetContent>
    </Sheet>
  )
}
