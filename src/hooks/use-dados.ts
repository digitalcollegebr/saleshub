"use client";

/**
 * Hooks de dados. Toda leitura passa por React Query — cache, revalidação e os
 * estados de carregando/erro que a interface precisa distinguir.
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/services";
import type { FiltrosDoPainel, Paginacao } from "@/types";

/** Filtros fazem parte da chave: recorte diferente é entrada de cache diferente. */
const chave = {
  usuario: ["usuario"] as const,
  origem: ["origem-dos-dados"] as const,
  opcoes: ["opcoes-de-filtro"] as const,
  painel: (f: FiltrosDoPainel) => ["painel-do-funil", f] as const,
  atencao: (f: FiltrosDoPainel) => ["conversas-com-atencao", f] as const,
  oportunidades: (f: FiltrosDoPainel) => ["oportunidades", f] as const,
  conversas: (f: FiltrosDoPainel, p: Paginacao) => ["conversas", f, p] as const,
  conversa: (id: string) => ["conversa", id] as const,
};

export function useUsuario() {
  return useQuery({ queryKey: chave.usuario, queryFn: () => api.obterUsuarioAtual() });
}

/**
 * Demonstração ou dados reais — pergunta ao servidor, que é quem sabe.
 *
 * Antes isto vinha de `NEXT_PUBLIC_USAR_MOCKS`, gravada no bundle em tempo de
 * build. O selo mentia sempre que a imagem tivesse sido construída com um valor e
 * o ambiente configurado com outro — e selo errado ninguém percebe olhando.
 *
 * Enquanto a resposta não chega, o modo fica indefinido e o selo não aparece:
 * melhor a ausência por um instante do que "demonstração" piscando sobre dado real.
 */
export function useOrigemDosDados() {
  return useQuery({
    queryKey: chave.origem,
    queryFn: async (): Promise<{ modo: "api" | "mock"; diagnostico: string }> => {
      const resposta = await fetch("/api/dados/estado", {
        headers: { Accept: "application/json" },
      });
      return resposta.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useOpcoesDeFiltro() {
  return useQuery({
    queryKey: chave.opcoes,
    queryFn: () => api.obterOpcoesDeFiltro(),
    staleTime: 30 * 60 * 1000,
  });
}

export function usePainelDoFunil(filtros: FiltrosDoPainel) {
  return useQuery({
    queryKey: chave.painel(filtros),
    queryFn: () => api.obterPainelDoFunil(filtros),
    placeholderData: (anterior) => anterior,
  });
}

export function useConversasComAtencao(filtros: FiltrosDoPainel) {
  return useQuery({
    queryKey: chave.atencao(filtros),
    queryFn: () => api.listarConversasComAtencao(filtros),
    placeholderData: (anterior) => anterior,
  });
}

export function useOportunidades(filtros: FiltrosDoPainel) {
  return useQuery({
    queryKey: chave.oportunidades(filtros),
    queryFn: () => api.listarOportunidadesEmAberto(filtros),
    placeholderData: (anterior) => anterior,
  });
}

/** Lista paginada. A página entra na chave: virar página é outra consulta, não outro filtro. */
export function useConversas(filtros: FiltrosDoPainel, paginacao: Paginacao) {
  return useQuery({
    queryKey: chave.conversas(filtros, paginacao),
    queryFn: () => api.listarConversas(filtros, paginacao),
  });
}

/** Uma conversa, com transcrição. `id` vazio não consulta. */
export function useConversa(id: string) {
  return useQuery({
    queryKey: chave.conversa(id),
    queryFn: () => api.obterConversa(id),
    enabled: Boolean(id),
  });
}
