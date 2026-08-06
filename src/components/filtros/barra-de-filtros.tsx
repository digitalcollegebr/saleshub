"use client";

import { FilterX } from "lucide-react";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useFiltros } from "@/hooks/use-filtros";
import { useOpcoesDeFiltro } from "@/hooks/use-dados";

const PERIODOS = [
  { dias: 7, rotulo: "7 dias" },
  { dias: 15, rotulo: "15 dias" },
  { dias: 30, rotulo: "30 dias" },
  { dias: 90, rotulo: "90 dias" },
] as const;

export function BarraDeFiltros() {
  const { filtros, definir, limpar, quantidadeAtiva } = useFiltros();
  const { data: opcoes, isPending } = useOpcoesDeFiltro();

  function aplicarPeriodo(dias: number) {
    const fim = new Date();
    const inicio = new Date(fim.getTime() - dias * 86400000);
    inicio.setHours(0, 0, 0, 0);
    definir("de", inicio.toISOString());
    definir("ate", fim.toISOString());
  }

  const diasAtuais = Math.round(
    (new Date(filtros.periodoFim).getTime() - new Date(filtros.periodoInicio).getTime()) / 86400000,
  );

  // Equipes e atendentes seguem a hierarquia: escolher unidade encurta a lista de
  // equipes, e escolher equipe encurta a de atendentes. Sem isso, um select de
  // sessenta nomes vira rolagem cega.
  const equipes = (opcoes?.equipes ?? []).filter(
    (e) => !filtros.unidadeId || e.unidadeId === filtros.unidadeId,
  );
  const atendentes = (opcoes?.atendentes ?? []).filter(
    (a) => !filtros.equipeId || a.equipeId === filtros.equipeId,
  );

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
          {PERIODOS.map((p) => {
            const ativo = Math.abs(diasAtuais - p.dias) <= 1;
            return (
              <button
                key={p.dias}
                type="button"
                onClick={() => aplicarPeriodo(p.dias)}
                aria-pressed={ativo}
                className={`focus:ring-marca/40 px-3 py-1.5 text-xs font-medium transition-colors focus:ring-2 focus:outline-none focus:ring-inset ${
                  ativo
                    ? "bg-marca text-white"
                    : "bg-superficie text-texto-fraco hover:bg-fundo-sutil"
                }`}
              >
                {p.rotulo}
              </button>
            );
          })}
        </div>
      </fieldset>

      <Select
        rotulo="Unidade"
        value={filtros.unidadeId ?? ""}
        onChange={(e) => {
          definir("unidade", e.target.value || undefined);
          definir("equipe", undefined);
          definir("atendente", undefined);
        }}
      >
        <option value="">Todas</option>
        {opcoes?.unidades.map((u) => (
          <option key={u.id} value={u.id}>
            {u.nome}
          </option>
        ))}
      </Select>

      <Select
        rotulo="Equipe"
        value={filtros.equipeId ?? ""}
        onChange={(e) => {
          definir("equipe", e.target.value || undefined);
          definir("atendente", undefined);
        }}
      >
        <option value="">Todas</option>
        {equipes.map((e) => (
          <option key={e.id} value={e.id}>
            {e.nome}
          </option>
        ))}
      </Select>

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
