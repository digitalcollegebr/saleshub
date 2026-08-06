"use client";

/**
 * Hooks de dados. Toda leitura passa por React Query — cache, revalidação e os
 * estados de carregando/erro que a interface precisa distinguir.
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/services";
import type { FiltrosDoPainel } from "@/types";

/** Filtros fazem parte da chave: recorte diferente é entrada de cache diferente. */
const chave = {
  usuario: ["usuario"] as const,
  opcoes: ["opcoes-de-filtro"] as const,
  painel: (f: FiltrosDoPainel) => ["painel-do-funil", f] as const,
  atencao: (f: FiltrosDoPainel) => ["conversas-com-atencao", f] as const,
  oportunidades: (f: FiltrosDoPainel) => ["oportunidades", f] as const,
};

export function useUsuario() {
  return useQuery({ queryKey: chave.usuario, queryFn: () => api.obterUsuarioAtual() });
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
