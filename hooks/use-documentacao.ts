"use client"

import useSWR from "swr"

interface ArtigoDocumentacao {
  id: string
  titulo: string
  conteudo: string
  secao: string
  ordem: number
  ativo: boolean
  criadoEm: string
  atualizadoEm: string
  atualizadoPor: {
    id: string
    nome: string
  } | null
}

interface DocumentacaoResponse {
  artigos: ArtigoDocumentacao[]
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useDocumentacao() {
  const { data, error, isLoading, mutate } = useSWR<DocumentacaoResponse>(
    "/api/documentacao",
    fetcher,
    { revalidateOnFocus: true }
  )

  return {
    artigos: data?.artigos ?? [],
    carregando: isLoading,
    erro: error ? "Erro ao carregar documentacao" : null,
    recarregar: () => mutate(),
  }
}
