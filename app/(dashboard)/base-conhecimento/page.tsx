"use client"

import { useState } from "react"
import { BookOpen, Plus, Pencil, Trash2, Save, X } from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/features/shared/PageHeader"
import { ConfirmDialog } from "@/components/features/shared/ConfirmDialog"
import { useBaseConhecimento, type ArtigoBase } from "@/hooks/use-base-conhecimento"

function ArtigoEditavel({
  artigo,
  onSalvar,
  onCancelar,
}: {
  artigo?: ArtigoBase
  onSalvar: (titulo: string, conteudo: string) => void
  onCancelar: () => void
}) {
  const [titulo, setTitulo] = useState(artigo?.titulo ?? "")
  const [conteudo, setConteudo] = useState(artigo?.conteudo ?? "")

  return (
    <Card>
      <CardContent className="space-y-3 pt-4">
        <Input
          placeholder="Titulo do topico"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />
        <Textarea
          placeholder="Conteudo que a Livia usara para responder perguntas..."
          value={conteudo}
          onChange={(e) => setConteudo(e.target.value)}
          rows={5}
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={() => onSalvar(titulo, conteudo)} disabled={!titulo.trim() || !conteudo.trim()}>
            <Save className="mr-1 h-3.5 w-3.5" />
            Salvar
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancelar}>
            <X className="mr-1 h-3.5 w-3.5" />
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function BaseConhecimentoPage() {
  const { artigos, carregando, recarregar } = useBaseConhecimento()
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [criando, setCriando] = useState(false)
  const [excluindoId, setExcluindoId] = useState<string | null>(null)

  async function salvarEdicao(id: string, titulo: string, conteudo: string) {
    await fetch(`/api/base-conhecimento/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo, conteudo }),
    })
    setEditandoId(null)
    recarregar()
  }

  async function criarArtigo(titulo: string, conteudo: string) {
    await fetch("/api/base-conhecimento", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo, conteudo }),
    })
    setCriando(false)
    recarregar()
  }

  async function excluirArtigo(id: string) {
    await fetch(`/api/base-conhecimento/${id}`, { method: "DELETE" })
    setExcluindoId(null)
    recarregar()
  }

  if (carregando) {
    return (
      <div>
        <PageHeader titulo="Base de Conhecimento" descricao="Informacoes que a Livia usa para responder perguntas" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader titulo="Base de Conhecimento" descricao="Informacoes que a Livia usa para responder perguntas">
        <Button size="sm" onClick={() => setCriando(true)}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Novo topico
        </Button>
      </PageHeader>

      <div className="mt-6">
        {criando && (
          <div className="mb-4">
            <ArtigoEditavel onSalvar={criarArtigo} onCancelar={() => setCriando(false)} />
          </div>
        )}

        {artigos.length === 0 && !criando ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">Nenhum topico cadastrado ainda.</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => setCriando(true)}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              Adicionar primeiro topico
            </Button>
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <Accordion type="multiple" className="w-full">
                {artigos.map((artigo) => (
                  <AccordionItem key={artigo.id} value={artigo.id}>
                    {editandoId === artigo.id ? (
                      <div className="py-3">
                        <ArtigoEditavel
                          artigo={artigo}
                          onSalvar={(t, c) => salvarEdicao(artigo.id, t, c)}
                          onCancelar={() => setEditandoId(null)}
                        />
                      </div>
                    ) : (
                      <>
                        <AccordionTrigger className="text-sm font-medium">
                          {artigo.titulo}
                        </AccordionTrigger>
                        <AccordionContent>
                          <p className="text-sm whitespace-pre-wrap">{artigo.conteudo}</p>
                          <div className="mt-3 flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => setEditandoId(artigo.id)}>
                              <Pencil className="mr-1 h-3.5 w-3.5" />
                              Editar
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setExcluindoId(artigo.id)}>
                              <Trash2 className="mr-1 h-3.5 w-3.5" />
                              Remover
                            </Button>
                          </div>
                        </AccordionContent>
                      </>
                    )}
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        )}
      </div>

      <ConfirmDialog
        aberto={!!excluindoId}
        onFechar={() => setExcluindoId(null)}
        onConfirmar={() => excluindoId && excluirArtigo(excluindoId)}
        titulo="Remover topico"
        descricao="Tem certeza que deseja remover este topico da base de conhecimento?"
      />
    </div>
  )
}
