"use client";

import { FilterX } from "lucide-react";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  intervaloDe,
  periodoAtivo,
  PERIODOS,
  useFiltros,
  type ChaveDePeriodo,
} from "@/hooks/use-filtros";
import { useOpcoesDeFiltro } from "@/hooks/use-dados";

/** `2026-08-07` a partir de um ISO, no fuso de quem olha — é o que o <input type=date> quer. */
function comoDataLocal(iso: string): string {
  const d = new Date(iso);
  const mes = `${d.getMonth() + 1}`.padStart(2, "0");
  const dia = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/**
 * `recortesComerciais` esconde Curso e Etapa.
 *
 * Curso de interesse e etapa do funil são leitura da negociação. Numa tela de
 * cobrança eles não filtram nada útil — filtram por uma classificação que aquelas
 * conversas nunca receberam — e, pior, sugerem que a régua comercial se aplica
 * ali. Um controle que promete um recorte e não entrega é pior que a ausência
 * dele; é o mesmo motivo por que unidade e campanha somem quando vêm vazias.
 */
export function BarraDeFiltros({ recortesComerciais = true }: { recortesComerciais?: boolean }) {
  const { filtros, definir, definirVarios, limpar, quantidadeAtiva } = useFiltros();
  const { data: opcoes, isPending } = useOpcoesDeFiltro();

  function aplicarPeriodo(chave: ChaveDePeriodo) {
    // Uma escrita só: `de` e `ate` formam um recorte, e gravá-los em duas
    // chamadas fazia a segunda apagar a primeira.
    definirVarios(intervaloDe(chave));
  }

  /**
   * Data escolhida à mão. O dia final entra **inteiro**: quem digita 07/08 quer
   * o dia 7 completo, não até a meia-noite que o abre. Sem isto, escolher o
   * mesmo dia nos dois campos devolveria zero conversas.
   */
  function aplicarData(campo: "de" | "ate", valor: string) {
    if (!valor) return;
    const [ano, mes, dia] = valor.split("-").map(Number);
    const d =
      campo === "de"
        ? new Date(ano, mes - 1, dia, 0, 0, 0, 0)
        : new Date(ano, mes - 1, dia, 23, 59, 59, 999);
    definirVarios({ [campo]: d.toISOString() });
  }

  const ativo = periodoAtivo(filtros.periodoInicio);

  // Equipes e atendentes seguem a hierarquia: escolher unidade encurta a lista de
  // equipes, e escolher equipe encurta a de atendentes. Sem isso, um select de
  // sessenta nomes vira rolagem cega.
  const equipes = (opcoes?.equipes ?? []).filter(
    (e) => !filtros.unidadeId || e.unidadeId === filtros.unidadeId,
  );
  const atendentes = (opcoes?.atendentes ?? []).filter(
    (a) => !filtros.equipeId || a.equipeId === filtros.equipeId,
  );

  // Filtro sem opção não vai para a tela. A fonte real não tem unidade nem
  // campanha (o SZ Chat não coleta), e um select com só "Todas" dentro é um
  // controle que promete um recorte e não entrega nenhum — pior que a ausência.
  const temUnidades = (opcoes?.unidades.length ?? 0) > 0;
  const temEquipes = equipes.length > 0;
  const temCampanhas = (opcoes?.campanhas.length ?? 0) > 0;
  // Atendente seguia a regra oposta às irmãs: aparecia sempre. Em produção a
  // lista veio vazia e sobrou um select com só "Todos" dentro — exatamente o
  // controle que promete recorte e não entrega, que o comentário acima recusa.
  const temAtendentes = atendentes.length > 0;

  if (isPending) {
    return (
      <div className="border-borda bg-superficie flex flex-wrap items-end gap-3 rounded-lg border p-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-36" />
        ))}
      </div>
    );
  }

  return (
    <section
      aria-label="Filtros do painel"
      className="border-borda bg-superficie flex flex-wrap items-end gap-3 rounded-lg border p-3"
    >
      <fieldset className="flex flex-col gap-1">
        <legend className="sr-only">Período</legend>
        <span className="text-texto-fraco text-[11px] font-medium tracking-wide uppercase">
          Período
        </span>
        <div className="border-borda flex overflow-hidden rounded-md border">
          {PERIODOS.map((p) => (
            <button
              key={p.chave}
              type="button"
              onClick={() => aplicarPeriodo(p.chave)}
              aria-pressed={ativo === p.chave}
              className={`focus:ring-marca/40 px-3 py-1.5 text-xs font-medium transition-colors focus:ring-2 focus:outline-none focus:ring-inset ${
                ativo === p.chave
                  ? "bg-marca text-white"
                  : "bg-superficie text-texto-fraco hover:bg-fundo-sutil"
              }`}
            >
              {p.rotulo}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Datas sempre visíveis, não escondidas atrás de um botão "personalizado":
          elas mostram o recorte em vigor mesmo quando ele veio de um preset, e
          um painel que não diz de quando é o número não serve para decidir. */}
      <fieldset className="flex flex-col gap-1">
        <legend className="sr-only">Intervalo específico</legend>
        <span className="text-texto-fraco text-[11px] font-medium tracking-wide uppercase">
          {ativo ? "Intervalo" : "Intervalo · personalizado"}
        </span>
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            aria-label="Data inicial"
            value={comoDataLocal(filtros.periodoInicio)}
            max={comoDataLocal(filtros.periodoFim)}
            onChange={(e) => aplicarData("de", e.target.value)}
            className="border-borda bg-superficie text-texto focus:border-marca focus:ring-marca/30 h-9 rounded-md border px-2 text-sm focus:ring-2 focus:outline-none"
          />
          <span className="text-texto-fraco text-xs">até</span>
          <input
            type="date"
            aria-label="Data final"
            value={comoDataLocal(filtros.periodoFim)}
            min={comoDataLocal(filtros.periodoInicio)}
            onChange={(e) => aplicarData("ate", e.target.value)}
            className="border-borda bg-superficie text-texto focus:border-marca focus:ring-marca/30 h-9 rounded-md border px-2 text-sm focus:ring-2 focus:outline-none"
          />
        </div>
      </fieldset>

      {temUnidades && (
        <Select
          rotulo="Unidade"
          value={filtros.unidadeId ?? ""}
          onChange={(e) =>
            // Trocar de unidade invalida equipe e atendente; as três mudanças
            // são um recorte só e precisam de uma escrita só.
            definirVarios({
              unidade: e.target.value || undefined,
              equipe: undefined,
              atendente: undefined,
            })
          }
        >
          <option value="">Todas</option>
          {opcoes?.unidades.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nome}
            </option>
          ))}
        </Select>
      )}

      {temEquipes && (
        <Select
          rotulo="Equipe"
          value={filtros.equipeId ?? ""}
          onChange={(e) =>
            definirVarios({ equipe: e.target.value || undefined, atendente: undefined })
          }
        >
          <option value="">Todas</option>
          {equipes.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nome}
            </option>
          ))}
        </Select>
      )}

      {temAtendentes && (
        <Select
          rotulo="Atendente"
          value={filtros.atendenteId ?? ""}
          onChange={(e) => definir("atendente", e.target.value || undefined)}
        >
          <option value="">Todos</option>
          {atendentes.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nome}
            </option>
          ))}
        </Select>
      )}

      {temCampanhas && (
        <Select
          rotulo="Campanha"
          value={filtros.campanhaId ?? ""}
          onChange={(e) => definir("campanha", e.target.value || undefined)}
        >
          <option value="">Todas</option>
          {opcoes?.campanhas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </Select>
      )}

      <Select
        rotulo="Canal"
        value={filtros.canal ?? ""}
        onChange={(e) => definir("canal", e.target.value || undefined)}
      >
        <option value="">Todos</option>
        {opcoes?.canais.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nome}
          </option>
        ))}
      </Select>

      {recortesComerciais && (
        <Select
          rotulo="Curso"
          value={filtros.cursoId ?? ""}
          onChange={(e) => definir("curso", e.target.value || undefined)}
        >
          <option value="">Todos</option>
          {opcoes?.cursos.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </Select>
      )}

      {recortesComerciais && (
        <Select
          rotulo="Etapa"
          value={filtros.etapaDoFunil ?? ""}
          onChange={(e) => definir("etapa", e.target.value || undefined)}
        >
          <option value="">Todas</option>
          {opcoes?.etapas.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nome}
            </option>
          ))}
        </Select>
      )}

      {quantidadeAtiva > 0 && (
        <button
          type="button"
          onClick={limpar}
          className="border-borda text-texto-fraco hover:bg-fundo-sutil focus:ring-marca/40 mb-0.5 inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors focus:ring-2 focus:outline-none"
        >
          <FilterX className="size-3.5" aria-hidden="true" />
          Limpar
          <Badge variante="marca">{quantidadeAtiva}</Badge>
        </button>
      )}
    </section>
  );
}
