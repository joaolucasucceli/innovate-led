"use client"

import useSWR from "swr"

export interface ArtigoBase {
  id: string
  titulo: string
  conteudo: string
  ordem: number
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useBaseConhecimento() {
  const { data, error, isLoading, mutate } = useSWR<ArtigoBase[]>(
    "/api/base-conhecimento",
    fetcher
  )

  return {
    artigos: data ?? [],
    carregando: isLoading,
    erro: error ? "Erro ao carregar base de conhecimento" : null,
    recarregar: () => mutate(),
  }
}
