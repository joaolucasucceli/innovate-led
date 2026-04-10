"use client"

import useSWR from "swr"

export interface RelatorioIA {
  id: string
  tipo: "publico" | "qualidade"
  conteudo: string
  dataRef: string
  conversas: number
  leads: number
  criadoEm: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useRelatorios(tipo?: "publico" | "qualidade") {
  const url = tipo ? `/api/relatorios?tipo=${tipo}` : "/api/relatorios"
  const { data, error, isLoading } = useSWR<RelatorioIA[]>(url, fetcher, {
    refreshInterval: 300000,
  })

  return {
    relatorios: data ?? [],
    carregando: isLoading,
    erro: error ? "Erro ao carregar relatórios" : null,
  }
}
