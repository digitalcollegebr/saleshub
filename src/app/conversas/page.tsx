"use client";

/**
 * A lista de conversas do recorte em vigor.
 *
 * É onde caem os links do painel: cartão de indicador e etapa do funil trazem
 * para cá o mesmo filtro que estava na tela, via query string. O painel responde
 * "quantas"; esta lista responde "quais", e cada linha leva à conversa inteira.
 */

import { Suspense, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BarraDeFiltros } from "@/components/filtros/barra-de-filtros";
import { Card, CardConteudo } from "@/components/ui/card";
import { EsqueletoDeBloco, EstadoDeErro, EstadoVazio } from "@/components/dados/estados";
import { SeloDeOrigem } from "@/components/dados/selo-origem";
import { useConversas } from "@/hooks/use-dados";
import { useFiltros } from "@/hooks/use-filtros";
import { formatarDataHora, formatarDuracao, formatarInteiro } from "@/lib/format";

const POR_PAGINA = 25;

function Conteudo() {
  const { filtros, limpar, quantidadeAtiva } = useFiltros();
  const [pagina, setPagina] = useState(1);
  const consulta = useConversas(filtros, { pagina, porPagina: POR_PAGINA });

  const ultimaPagina = consulta.data ? Math.ceil(consulta.data.total / POR_PAGINA) : 1;

  return (
    <div className="space-y-4">
      <BarraDeFiltros />

      {consulta.isError ? (
        <EstadoDeErro erro={consulta.error} aoTentarNovamente={() => consulta.refetch()} />
      ) : consulta.isPending ? (
        <EsqueletoDeBloco linhas={8} />
      ) : consulta.data.itens.length === 0 ? (
        <EstadoVazio
          titulo="Nenhuma conversa neste recorte"
          descricao={
            quantidadeAtiva > 0
              ? "Os filtros aplicados não retornaram conversas."
              : "Não há conversas no período selecionado. Amplie o intervalo."
          }
          acao={
            quantidadeAtiva > 0 ? (
              <button
                type="button"
                onClick={limpar}
                className="border-borda text-texto hover:bg-fundo-sutil mt-1 rounded-md border px-3 py-1.5 text-xs font-medium"
              >
                Limpar filtros
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          <Card>
            <CardConteudo className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-texto-fraco border-borda border-b text-[11px] uppercase">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-medium">Lead</th>
                      <th className="px-4 py-2.5 text-left font-medium">Atendente</th>
                      <th className="px-4 py-2.5 text-left font-medium">Etapa</th>
                      <th className="px-4 py-2.5 text-right font-medium">Mensagens</th>
                      <th className="px-4 py-2.5 text-right font-medium">1ª resposta</th>
                      <th className="px-4 py-2.5 text-right font-medium">Início</th>
                    </tr>
                  </thead>
                  <tbody className="divide-borda divide-y">
                    {consulta.data.itens.map((c) => (
                      <tr key={c.id} className="hover:bg-fundo-sutil transition-colors">
                        <td className="px-4 py-2.5">
                          <Link
                            href={`/conversas/${c.id}`}
                            className="text-texto hover:text-marca font-medium"
                          >
                            {c.leadNome || "Sem nome"}
                          </Link>
                        </td>
                        <td className="text-texto-fraco px-4 py-2.5">{c.atendenteNome ?? "—"}</td>
                        <td className="px-4 py-2.5">
                          <span className="flex items-center gap-1.5">
                            <span className="text-texto-fraco">
                              {c.etapaDoFunil?.valor ?? "não classificada"}
                            </span>
                            {c.etapaDoFunil && (
                              <SeloDeOrigem
                                origem={c.etapaDoFunil.origem}
                                confianca={c.etapaDoFunil.confianca}
                                compacto
                              />
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          {formatarInteiro(c.totalDeMensagens)}
                        </td>
                        <td className="text-texto-fraco px-4 py-2.5 text-right tabular-nums">
                          {formatarDuracao(c.tempoAtePrimeiraRespostaSegundos)}
                        </td>
                        <td className="text-texto-fraco px-4 py-2.5 text-right whitespace-nowrap">
                          {formatarDataHora(c.iniciadaEm)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardConteudo>
          </Card>

          <div className="text-texto-fraco flex items-center justify-between text-xs">
            <span>
              {formatarInteiro(consulta.data.total)} conversas · página {pagina} de{" "}
              {formatarInteiro(ultimaPagina)}
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={pagina <= 1}
                className="border-borda hover:bg-fundo-sutil inline-flex h-8 items-center gap-1 rounded-md border px-2.5 disabled:opacity-40"
              >
                <ChevronLeft className="size-3.5" aria-hidden="true" />
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPagina((p) => p + 1)}
                disabled={pagina >= ultimaPagina}
                className="border-borda hover:bg-fundo-sutil inline-flex h-8 items-center gap-1 rounded-md border px-2.5 disabled:opacity-40"
              >
                Próxima
                <ChevronRight className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function PaginaDeConversas() {
  // `useSearchParams` exige limite de Suspense no App Router.
  return (
    <Suspense fallback={<EsqueletoDeBloco linhas={8} />}>
      <Conteudo />
    </Suspense>
  );
}
