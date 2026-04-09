"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Plus, MoreHorizontal, Check, Undo2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PageHeader } from "@/components/features/shared/PageHeader"
import { DataTable, type ColunaConfig } from "@/components/features/shared/DataTable"
import { ConfirmDialog } from "@/components/features/shared/ConfirmDialog"
import { SkeletonTabela } from "@/components/features/shared/SkeletonTabela"
import { EmptyState } from "@/components/features/shared/EmptyState"
import { ErrorState } from "@/components/features/shared/ErrorState"
import { useSolicitacoes } from "@/hooks/use-solicitacoes"

interface Solicitacao {
  id: string
  titulo: string
  descricao: string
  status: "pendente" | "concluida"
  criadoPorId: string
  criadoEm: string
  atualizadoEm: string
  concluidoEm: string | null
  criadoPor: {
    id: string
    nome: string
    email: string
  }
}

const statusLabels: Record<string, string> = {
  pendente: "Pendente",
  concluida: "Concluida",
}

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pendente: "secondary",
  concluida: "default",
}

export default function SolicitacoesPage() {
  const { data: session } = useSession()
  const [pagina, setPagina] = useState(1)
  const [filtroStatus, setFiltroStatus] = useState<string>("")

  const [formAberto, setFormAberto] = useState(false)
  const [titulo, setTitulo] = useState("")
  const [descricao, setDescricao] = useState("")
  const [enviando, setEnviando] = useState(false)

  const [confirmAberto, setConfirmAberto] = useState(false)
  const [solicitacaoAlvo, setSolicitacaoAlvo] = useState<Solicitacao | null>(null)
  const [acaoAlvo, setAcaoAlvo] = useState<"excluir" | "status">("excluir")

  const { solicitacoes, total, carregando, erro, recarregar } = useSolicitacoes(
    pagina,
    filtroStatus
  )

  async function handleCriar() {
    if (!titulo.trim() || !descricao.trim()) {
      toast.error("Preencha todos os campos")
      return
    }

    setEnviando(true)
    try {
      const res = await fetch("/api/solicitacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo: titulo.trim(), descricao: descricao.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || "Erro ao criar solicitacao")
        return
      }

      toast.success("Solicitacao criada com sucesso")
      setTitulo("")
      setDescricao("")
      setFormAberto(false)
      recarregar()
    } catch {
      toast.error("Erro ao criar solicitacao")
    } finally {
      setEnviando(false)
    }
  }

  function handleToggleStatus(s: Solicitacao) {
    setSolicitacaoAlvo(s)
    setAcaoAlvo("status")
    setConfirmAberto(true)
  }

  function handleExcluir(s: Solicitacao) {
    setSolicitacaoAlvo(s)
    setAcaoAlvo("excluir")
    setConfirmAberto(true)
  }

  async function confirmarAcao() {
    if (!solicitacaoAlvo) return

    try {
      if (acaoAlvo === "excluir") {
        const res = await fetch(`/api/solicitacoes/${solicitacaoAlvo.id}`, {
          method: "DELETE",
        })
        if (!res.ok) {
          toast.error("Erro ao excluir")
          return
        }
        toast.success("Solicitacao excluida")
      } else {
        const novoStatus = solicitacaoAlvo.status === "pendente" ? "concluida" : "pendente"
        const res = await fetch(`/api/solicitacoes/${solicitacaoAlvo.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: novoStatus }),
        })
        if (!res.ok) {
          toast.error("Erro ao atualizar status")
          return
        }
        toast.success(
          novoStatus === "concluida"
            ? "Marcada como concluida"
            : "Reaberta"
        )
      }
      recarregar()
    } catch {
      toast.error("Erro ao executar acao")
    } finally {
      setConfirmAberto(false)
      setSolicitacaoAlvo(null)
    }
  }

  const colunas: ColunaConfig<Solicitacao>[] = [
    {
      chave: "titulo",
      titulo: "Titulo",
      ordenavel: true,
    },
    {
      chave: "descricao",
      titulo: "Descricao",
      classesCelula: "hidden md:table-cell max-w-[300px] truncate",
    },
    {
      chave: "status",
      titulo: "Status",
      renderizar: (s) => (
        <Badge variant={statusVariants[s.status]}>
          {statusLabels[s.status]}
        </Badge>
      ),
    },
    {
      chave: "criadoPor" as keyof Solicitacao,
      titulo: "Criado por",
      classesCelula: "hidden lg:table-cell",
      renderizar: (s) => s.criadoPor.nome,
    },
    {
      chave: "criadoEm",
      titulo: "Data",
      classesCelula: "hidden sm:table-cell",
      renderizar: (s) =>
        new Date(s.criadoEm).toLocaleDateString("pt-BR"),
    },
    {
      chave: "id" as keyof Solicitacao,
      titulo: "",
      renderizar: (s: Solicitacao) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleToggleStatus(s)}>
              {s.status === "pendente" ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Marcar como concluida
                </>
              ) : (
                <>
                  <Undo2 className="mr-2 h-4 w-4" />
                  Reabrir
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleExcluir(s)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  if (erro) {
    return (
      <div>
        <PageHeader titulo="Solicitacoes de Alteracao" />
        <div className="mt-6">
          <ErrorState mensagem={erro} onTentar={recarregar} />
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        titulo="Solicitacoes de Alteracao"
        descricao="Solicite alteracoes e acompanhe o andamento"
      >
        <Button onClick={() => setFormAberto(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Solicitacao
        </Button>
      </PageHeader>

      <div className="mt-6">
        {carregando && solicitacoes.length === 0 ? (
          <SkeletonTabela linhas={5} colunas={5} />
        ) : !carregando && solicitacoes.length === 0 && !filtroStatus ? (
          <EmptyState
            titulo="Nenhuma solicitacao"
            descricao="Crie uma solicitacao de alteracao para acompanhar."
            textoBotao="Nova Solicitacao"
            onAcao={() => setFormAberto(true)}
          />
        ) : (
          <DataTable
            colunas={colunas}
            dados={solicitacoes}
            total={total}
            pagina={pagina}
            porPagina={10}
            onPaginaChange={setPagina}
            carregando={carregando}
            filtros={
              <Select
                value={filtroStatus}
                onValueChange={(v) => {
                  setFiltroStatus(v === "todos" ? "" : v)
                  setPagina(1)
                }}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="pendente">Pendentes</SelectItem>
                  <SelectItem value="concluida">Concluidas</SelectItem>
                </SelectContent>
              </Select>
            }
          />
        )}
      </div>

      <Dialog open={formAberto} onOpenChange={setFormAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Solicitacao de Alteracao</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Titulo</Label>
              <Input
                id="titulo"
                placeholder="Ex: Adicionar campo de telefone no cadastro"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descricao</Label>
              <Textarea
                id="descricao"
                placeholder="Descreva em detalhes o que precisa ser alterado..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFormAberto(false)}
              disabled={enviando}
            >
              Cancelar
            </Button>
            <Button onClick={handleCriar} disabled={enviando}>
              {enviando ? "Criando..." : "Criar Solicitacao"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        titulo={
          acaoAlvo === "excluir"
            ? "Excluir solicitacao"
            : solicitacaoAlvo?.status === "pendente"
              ? "Marcar como concluida"
              : "Reabrir solicitacao"
        }
        descricao={
          acaoAlvo === "excluir"
            ? `Tem certeza que deseja excluir "${solicitacaoAlvo?.titulo}"?`
            : solicitacaoAlvo?.status === "pendente"
              ? `Marcar "${solicitacaoAlvo?.titulo}" como concluida?`
              : `Reabrir "${solicitacaoAlvo?.titulo}"?`
        }
        aberto={confirmAberto}
        onFechar={() => {
          setConfirmAberto(false)
          setSolicitacaoAlvo(null)
        }}
        onConfirmar={confirmarAcao}
        variante={acaoAlvo === "excluir" ? "destrutivo" : "padrao"}
        textoBotao={
          acaoAlvo === "excluir"
            ? "Excluir"
            : solicitacaoAlvo?.status === "pendente"
              ? "Concluir"
              : "Reabrir"
        }
      />
    </div>
  )
}
