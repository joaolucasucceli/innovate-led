"use client"

import useSWR from "swr"

interface SolicitacaoAlteracao {
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

interface SolicitacoesResponse {
  dados: SolicitacaoAlteracao[]
  total: number
  pagina: number
  porPagina: number
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useSolicitacoes(
  pagina: number = 1,
  status: string = ""
) {
  const params = new URLSearchParams()
  params.set("pagina", String(pagina))
  params.set("porPagina", "10")
  if (status) params.set("status", status)

  const { data, error, isLoading, mutate } = useSWR<SolicitacoesResponse>(
    `/api/solicitacoes?${params.toString()}`,
    fetcher,
    { revalidateOnFocus: true }
  )

  return {
    solicitacoes: data?.dados ?? [],
    total: data?.total ?? 0,
    pagina: data?.pagina ?? 1,
    porPagina: data?.porPagina ?? 10,
    carregando: isLoading,
    erro: error ? "Erro ao carregar solicitacoes" : null,
    recarregar: () => mutate(),
  }
}
