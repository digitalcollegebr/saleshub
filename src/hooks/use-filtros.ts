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

/**
 * Períodos de calendário, não janelas móveis.
 *
 * "Últimos 7 dias" e "esta semana" respondem perguntas diferentes: a primeira
 * muda de conteúdo a cada hora, a segunda é o recorte que aparece na reunião de
 * segunda. Quem opera o painel pergunta "como foi hoje", "como está a semana" —
 * e é isso que os botões passam a recortar.
 *
 * Todos os limites são calculados no fuso do navegador e depois convertidos para
 * UTC pelo `toISOString`. Meia-noite aqui é meia-noite de quem olha, não de
 * Greenwich: com o horário de Fortaleza (UTC−3), "hoje" começa às 03:00Z.
 */
export type ChaveDePeriodo = "hoje" | "semana" | "mes";

export const PERIODOS: readonly { chave: ChaveDePeriodo; rotulo: string }[] = [
  { chave: "hoje", rotulo: "Hoje" },
  { chave: "semana", rotulo: "Semana" },
  { chave: "mes", rotulo: "Mês" },
] as const;

function iso(data: Date): string {
  return data.toISOString();
}

function inicioDoDia(base: Date): Date {
  const d = new Date(base);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Segunda-feira da semana corrente. Semana comercial começa na segunda. */
function inicioDaSemana(base: Date): Date {
  const d = inicioDoDia(base);
  // getDay(): 0 = domingo. Domingo pertence à semana que começou na segunda anterior.
  const desdeSegunda = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - desdeSegunda);
  return d;
}

function inicioDoMes(base: Date): Date {
  const d = inicioDoDia(base);
  d.setDate(1);
  return d;
}

export function intervaloDe(
  chave: ChaveDePeriodo,
  agora = new Date(),
): { de: string; ate: string } {
  const inicio =
    chave === "hoje"
      ? inicioDoDia(agora)
      : chave === "semana"
        ? inicioDaSemana(agora)
        : inicioDoMes(agora);
  return { de: iso(inicio), ate: iso(agora) };
}

/**
 * Qual botão está aceso, deduzido do recorte — não de um parâmetro à parte.
 *
 * O `de` de cada período é determinístico; o `ate` é "agora" e muda a cada
 * clique, então a comparação usa só o início. Na segunda-feira "hoje" e "semana"
 * começam no mesmo instante e o empate cai em "hoje": os dois recortes são
 * idênticos nesse dia, então a escolha é cosmética e se desfaz na terça.
 */
export function periodoAtivo(de: string, agora = new Date()): ChaveDePeriodo | null {
  return PERIODOS.find((p) => intervaloDe(p.chave, agora).de === de)?.chave ?? null;
}

export const PERIODO_PADRAO: ChaveDePeriodo = "hoje";

export function periodoPadrao(): { inicio: string; fim: string } {
  const { de, ate } = intervaloDe(PERIODO_PADRAO);
  return { inicio: de, fim: ate };
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

  /**
   * Altera vários parâmetros de uma vez.
   *
   * Existe porque `definir` chamado duas vezes seguidas **não** compõe: as duas
   * chamadas acontecem no mesmo evento e leem o mesmo `parametros` do closure,
   * então a segunda monta a URL a partir do estado anterior e sobrescreve a
   * primeira. Era o que quebrava o filtro de período: `de` e `ate` eram gravados
   * em sequência, sobrava só `ate`, e todo botão devolvia a janela padrão de 30
   * dias — o filtro parecia não funcionar porque de fato não funcionava.
   */
  const definirVarios = useCallback(
    (pares: Record<string, string | undefined>) => {
      const novos = new URLSearchParams(parametros.toString());
      for (const [chave, valor] of Object.entries(pares)) {
        if (valor) novos.set(chave, valor);
        else novos.delete(chave);
      }
      router.replace(`${caminho}?${novos.toString()}`, { scroll: false });
    },
    [parametros, router, caminho],
  );

  const definir = useCallback(
    (chave: string, valor: string | undefined) => definirVarios({ [chave]: valor }),
    [definirVarios],
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

  return { filtros, definir, definirVarios, limpar, linkParaConversas, quantidadeAtiva };
}
