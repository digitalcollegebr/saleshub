"use client";

/**
 * Filtros na URL, não em estado local.
 *
 * O estado de um painel é um link: gestor manda "olha esse recorte" no WhatsApp e
 * a outra pessoa vê exatamente a mesma tela. Isso também dá voltar/avançar do
 * navegador de graça e sobrevive a F5.
 */

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { FiltrosDoPainel } from "@/types";

const PADRAO_DIAS = 30;

function iso(data: Date): string {
  return data.toISOString();
}

export function periodoPadrao(): { inicio: string; fim: string } {
  const fim = new Date();
  const inicio = new Date(fim.getTime() - PADRAO_DIAS * 86400000);
  inicio.setHours(0, 0, 0, 0);
  return { inicio: iso(inicio), fim: iso(fim) };
}

export function useFiltros() {
  const parametros = useSearchParams();
  const router = useRouter();
  const caminho = usePathname();

  const filtros = useMemo<FiltrosDoPainel>(() => {
    const padrao = periodoPadrao();
    return {
      periodoInicio: parametros.get("de") ?? padrao.inicio,
      periodoFim: parametros.get("ate") ?? padrao.fim,
      unidadeId: parametros.get("unidade") ?? undefined,
      equipeId: parametros.get("equipe") ?? undefined,
      atendenteId: parametros.get("atendente") ?? undefined,
      campanhaId: parametros.get("campanha") ?? undefined,
      canal: parametros.get("canal") ?? undefined,
      cursoId: parametros.get("curso") ?? undefined,
      etapaDoFunil: parametros.get("etapa") ?? undefined,
    };
  }, [parametros]);

  const definir = useCallback(
    (chave: string, valor: string | undefined) => {
      const novos = new URLSearchParams(parametros.toString());
      if (valor) novos.set(chave, valor);
      else novos.delete(chave);
      router.replace(`${caminho}?${novos.toString()}`, { scroll: false });
    },
    [parametros, router, caminho],
  );

  const limpar = useCallback(() => {
    router.replace(caminho, { scroll: false });
  }, [router, caminho]);

  /** Monta o link do painel para a lista de conversas, preservando o recorte. */
  const linkParaConversas = useCallback(
    (extra?: Record<string, string>) => {
      const novos = new URLSearchParams(parametros.toString());
      for (const [k, v] of Object.entries(extra ?? {})) novos.set(k, v);
      return `/conversas?${novos.toString()}`;
    },
    [parametros],
  );

  const quantidadeAtiva = [
    filtros.unidadeId,
    filtros.equipeId,
    filtros.atendenteId,
    filtros.campanhaId,
    filtros.canal,
    filtros.cursoId,
    filtros.etapaDoFunil,
  ].filter(Boolean).length;

  return { filtros, definir, limpar, linkParaConversas, quantidadeAtiva };
}
