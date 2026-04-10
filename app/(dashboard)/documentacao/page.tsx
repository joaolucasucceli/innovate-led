"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Plus, Pencil, Trash2, MoreHorizontal, BookOpen } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/features/shared/PageHeader"
import { LoadingState } from "@/components/features/shared/LoadingState"
import { ErrorState } from "@/components/features/shared/ErrorState"
import { EmptyState } from "@/components/features/shared/EmptyState"
import { ConfirmDialog } from "@/components/features/shared/ConfirmDialog"
import { useDocumentacao } from "@/hooks/use-documentacao"

interface Artigo {
  id: string
  titulo: string
  conteudo: string
  secao: string
  ordem: number
  criadoEm: string
  atualizadoEm: string
  atualizadoPor: { id: string; nome: string } | null
}

const SECOES = [
  { valor: "geral", titulo: "Geral" },
  { valor: "dashboard", titulo: "Dashboard" },
  { valor: "atendimentos", titulo: "Atendimentos" },
  { valor: "leads", titulo: "Leads" },
  { valor: "configuracoes", titulo: "Configurações" },
  { valor: "agente-ia", titulo: "Agente IA" },
  { valor: "outros", titulo: "Outros" },
]

export default function DocumentacaoPage() {
  const { data: session } = useSession()
  const { artigos, carregando, erro, recarregar } = useDocumentacao()

  const [formAberto, setFormAberto] = useState(false)
  const [editando, setEditando] = useState<Artigo | null>(null)
  const [titulo, setTitulo] = useState("")
  const [conteudo, setConteudo] = useState("")
  const [secao, setSecao] = useState("geral")
  const [enviando, setEnviando] = useState(false)

  const [confirmAberto, setConfirmAberto] = useState(false)
  const [artigoAlvo, setArtigoAlvo] = useState<Artigo | null>(null)

  const isGestor = session?.user?.perfil === "gestor"

  const secoesComArtigos = SECOES.filter((s) =>
    artigos.some((a) => a.secao === s.valor)
  )

  function abrirFormNovo() {
    setEditando(null)
    setTitulo("")
    setConteudo("")
    setSecao("geral")
    setFormAberto(true)
  }

  function abrirFormEditar(artigo: Artigo) {
    setEditando(artigo)
    setTitulo(artigo.titulo)
    setConteudo(artigo.conteudo)
    setSecao(artigo.secao)
    setFormAberto(true)
  }

  function handleExcluir(artigo: Artigo) {
    setArtigoAlvo(artigo)
    setConfirmAberto(true)
  }

  async function handleSalvar() {
    if (!titulo.trim() || !conteudo.trim()) {
      toast.error("Preencha todos os campos")
      return
    }

    setEnviando(true)
    try {
      if (editando) {
        const res = await fetch(`/api/documentacao/${editando.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            titulo: titulo.trim(),
            conteudo: conteudo.trim(),
            secao,
          }),
        })
        if (!res.ok) {
          const data = await res.json()
          toast.error(data.error || "Erro ao atualizar artigo")
          return
        }
        toast.success("Artigo atualizado")
      } else {
        const res = await fetch("/api/documentacao", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            titulo: titulo.trim(),
            conteudo: conteudo.trim(),
            secao,
          }),
        })
        if (!res.ok) {
          const data = await res.json()
          toast.error(data.error || "Erro ao criar artigo")
          return
        }
        toast.success("Artigo criado")
      }
      setFormAberto(false)
      recarregar()
    } catch {
      toast.error("Erro ao salvar artigo")
    } finally {
      setEnviando(false)
    }
  }

  async function confirmarExcluir() {
    if (!artigoAlvo) return
    try {
      const res = await fetch(`/api/documentacao/${artigoAlvo.id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        toast.error("Erro ao excluir artigo")
        return
      }
      toast.success("Artigo excluído")
      recarregar()
    } catch {
      toast.error("Erro ao excluir artigo")
    } finally {
      setConfirmAberto(false)
      setArtigoAlvo(null)
    }
  }

  if (carregando) {
    return (
      <div>
        <PageHeader titulo="Documentação" descricao="Base de conhecimento do sistema" />
        <div className="mt-6"><LoadingState /></div>
      </div>
    )
  }

  if (erro) {
    return (
      <div>
        <PageHeader titulo="Documentação" descricao="Base de conhecimento do sistema" />
        <div className="mt-6">
          <ErrorState mensagem={erro} onTentar={recarregar} />
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        titulo="Documentação"
        descricao="Base de conhecimento do sistema"
      >
        {isGestor && (
          <Button onClick={abrirFormNovo}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Artigo
          </Button>
        )}
      </PageHeader>

      <div className="mt-6">
        {artigos.length === 0 ? (
          <EmptyState
            titulo="Nenhum artigo cadastrado"
            descricao="Crie artigos para montar a base de conhecimento do sistema."
            textoBotao={isGestor ? "Novo Artigo" : undefined}
            onAcao={isGestor ? abrirFormNovo : undefined}
          />
        ) : secoesComArtigos.length > 1 ? (
          <Tabs defaultValue={secoesComArtigos[0]?.valor}>
            <TabsList>
              {secoesComArtigos.map((s) => (
                <TabsTrigger key={s.valor} value={s.valor}>
                  {s.titulo}
                </TabsTrigger>
              ))}
            </TabsList>
            {secoesComArtigos.map((s) => (
              <TabsContent key={s.valor} value={s.valor} className="mt-4 space-y-4">
                {artigos
                  .filter((a) => a.secao === s.valor)
                  .map((artigo) => (
                    <ArtigoCard
                      key={artigo.id}
                      artigo={artigo}
                      isGestor={isGestor}
                      onEditar={abrirFormEditar}
                      onExcluir={handleExcluir}
                    />
                  ))}
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="space-y-4">
            {artigos.map((artigo) => (
              <ArtigoCard
                key={artigo.id}
                artigo={artigo}
                isGestor={isGestor}
                onEditar={abrirFormEditar}
                onExcluir={handleExcluir}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={formAberto} onOpenChange={setFormAberto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editando ? "Editar Artigo" : "Novo Artigo"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título</Label>
                <Input
                  id="titulo"
                  placeholder="Ex: Como usar o kanban"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secao">Seção</Label>
                <Select value={secao} onValueChange={setSecao}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SECOES.map((s) => (
                      <SelectItem key={s.valor} value={s.valor}>
                        {s.titulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="conteudo">Conteúdo</Label>
              <Textarea
                id="conteudo"
                placeholder="Escreva o conteúdo do artigo..."
                value={conteudo}
                onChange={(e) => setConteudo(e.target.value)}
                rows={12}
                className="font-mono text-sm"
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
            <Button onClick={handleSalvar} disabled={enviando}>
              {enviando ? "Salvando..." : editando ? "Salvar" : "Criar Artigo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        titulo="Excluir artigo"
        descricao={`Tem certeza que deseja excluir "${artigoAlvo?.titulo}"?`}
        aberto={confirmAberto}
        onFechar={() => {
          setConfirmAberto(false)
          setArtigoAlvo(null)
        }}
        onConfirmar={confirmarExcluir}
        variante="destrutivo"
        textoBotao="Excluir"
      />
    </div>
  )
}

function ArtigoCard({
  artigo,
  isGestor,
  onEditar,
  onExcluir,
}: {
  artigo: Artigo
  isGestor: boolean
  onEditar: (a: Artigo) => void
  onExcluir: (a: Artigo) => void
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <BookOpen className="mt-1 h-5 w-5 text-muted-foreground shrink-0" />
          <div>
            <CardTitle className="text-base">{artigo.titulo}</CardTitle>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-[10px]">
                {SECOES.find((s) => s.valor === artigo.secao)?.titulo || artigo.secao}
              </Badge>
              {artigo.atualizadoPor && (
                <span>
                  Atualizado por {artigo.atualizadoPor.nome} em{" "}
                  {new Date(artigo.atualizadoEm).toLocaleDateString("pt-BR")}
                </span>
              )}
            </div>
          </div>
        </div>
        {isGestor && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEditar(artigo)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onExcluir(artigo)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      <CardContent>
        <div className="whitespace-pre-wrap text-sm text-muted-foreground">
          {artigo.conteudo}
        </div>
      </CardContent>
    </Card>
  )
}
