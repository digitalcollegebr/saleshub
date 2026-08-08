"use client";

/**
 * Painel do funil conversacional — a primeira tela do SalesHub.
 *
 * Ordem deliberada da leitura: indicadores (o que aconteceu) → funil (onde as
 * conversas estão) → evolução (para onde vai) → distribuições (por quê) →
 * pessoas (quem) → ação (o que fazer agora). As duas últimas seções existem para
 * que o painel termine em trabalho, não em contemplação.
 */

import { Suspense } from "react";
import { AlertTriangle } from "lucide-react";
import { BarraDeFiltros } from "@/components/filtros/barra-de-filtros";
import { CartaoIndicador } from "@/components/dados/cartao-indicador";
import {
  EsqueletoDeBloco,
  EsqueletoDeCartao,
  EstadoDeErro,
  EstadoVazio,
} from "@/components/dados/estados";
import { FunilDeConversas } from "@/components/funil/funil-de-conversas";
import { RepasseParaOConsultor } from "@/components/funil/repasse";
import { GraficoDeDistribuicao, GraficoDeVolume } from "@/components/funil/graficos";
import {
  ConversasComAtencao,
  OportunidadesEmAberto,
  RankingDeAtendentes,
} from "@/components/funil/listas";
import { useConversasComAtencao, useOportunidades, usePainelDoFunil } from "@/hooks/use-dados";
import { useFiltros } from "@/hooks/use-filtros";
import { MARCA } from "@/lib/brand";
import { formatarDataHora } from "@/lib/format";

function ConteudoDoPainel() {
  const { filtros, limpar, linkParaConversas, quantidadeAtiva, periodoInvertido } = useFiltros();
  const painel = usePainelDoFunil(filtros);
  const atencao = useConversasComAtencao(filtros);
  const oportunidades = useOportunidades(filtros);

  return (
    <div className="space-y-4">
      <BarraDeFiltros />

      {painel.isError ? (
        <EstadoDeErro erro={painel.error} aoTentarNovamente={() => painel.refetch()} />
      ) : painel.isPending ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <EsqueletoDeCartao key={i} altura="h-[7.5rem]" />
            ))}
          </div>
          <div className="grid gap-4 xl:grid-cols-[3fr_2fr]">
            <EsqueletoDeCartao altura="h-[28rem]" />
            <EsqueletoDeCartao altura="h-[28rem]" />
          </div>
        </div>
      ) : painel.data.totalDeConversasNoPeriodo === 0 ? (
        <EstadoVazio
          titulo="Nenhuma conversa neste recorte"
          descricao={
            periodoInvertido
              ? "A data final é anterior à inicial. Corrija o intervalo — não há janela para consultar."
              : quantidadeAtiva > 0
                ? "Os filtros aplicados não retornaram conversas. Isso não significa ausência de atendimento — significa que este corte está vazio."
                : "Não há conversas registradas no período selecionado. Amplie o intervalo de datas."
          }
          acao={
            quantidadeAtiva > 0 ? (
              <button
                type="button"
                onClick={limpar}
                className="border-borda text-texto hover:bg-fundo-sutil focus:ring-marca/40 mt-1 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors focus:ring-2 focus:outline-none"
              >
                Limpar filtros
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          <section aria-label="Indicadores do período">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {painel.data.indicadores.map((indicador) => (
                <CartaoIndicador
                  key={indicador.chave}
                  indicador={indicador}
                  href={
                    indicador.filtroDeOrigem
                      ? linkParaConversas(indicador.filtroDeOrigem)
                      : undefined
                  }
                />
              ))}
            </div>
          </section>

          {/* Antes do funil: se o lead não chegou a um consultor, não houve
              negociação para o funil descrever. */}
          <RepasseParaOConsultor
            repasse={painel.data.repasse}
            hrefDoIndicador={linkParaConversas}
          />

          <div className="grid gap-4 xl:grid-cols-[3fr_2fr]">
            <FunilDeConversas
              etapas={painel.data.funil}
              hrefDaEtapa={(chave) => linkParaConversas({ etapa: chave })}
            />
            <GraficoDeVolume serie={painel.data.serieDeVolume} />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <GraficoDeDistribuicao
              titulo="Principais objeções"
              descricao="Resistências identificadas pela análise. O percentual é a fatia de cada motivo entre as objeções registradas."
              itens={painel.data.objecoes}
              vazioTitulo="Nenhuma objeção identificada"
              vazioDescricao="A análise não encontrou resistências registradas nas conversas filtradas."
              cores={[MARCA.serie[3], MARCA.serie[4]]}
            />
            <GraficoDeDistribuicao
              titulo="Cursos mais procurados"
              descricao="Curso de interesse inferido do conteúdo da conversa. O percentual é sobre as conversas em que houve curso identificado."
              itens={painel.data.cursos}
              vazioTitulo="Nenhum curso identificado"
              vazioDescricao="As conversas filtradas não permitiram identificar curso de interesse."
            />
            <GraficoDeDistribuicao
              titulo="Sentimento do lead"
              descricao="Tom predominante do lead. O percentual é sobre as conversas que já têm leitura de sentimento, não sobre o período."
              itens={painel.data.sentimentos}
              vazioTitulo="Sem leitura de sentimento"
              vazioDescricao="Não há conversas suficientes para uma leitura de sentimento."
              cores={[MARCA.cores.acento, MARCA.serie[5], MARCA.serie[4]]}
            />
          </div>

          <RankingDeAtendentes linhas={painel.data.ranking} />

          <div className="grid gap-4 xl:grid-cols-2">
            {atencao.isError ? (
              <EstadoDeErro erro={atencao.error} aoTentarNovamente={() => atencao.refetch()} />
            ) : atencao.isPending ? (
              <EsqueletoDeBloco linhas={6} />
            ) : (
              <ConversasComAtencao itens={atencao.data} />
            )}

            {oportunidades.isError ? (
              <EstadoDeErro
                erro={oportunidades.error}
                aoTentarNovamente={() => oportunidades.refetch()}
              />
            ) : oportunidades.isPending ? (
              <EsqueletoDeBloco linhas={6} />
            ) : (
              <OportunidadesEmAberto itens={oportunidades.data} />
            )}
          </div>

          <footer className="border-borda text-texto-fraco flex flex-wrap items-center gap-2 border-t pt-3 text-[11px]">
            <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
            <p className="max-w-4xl leading-relaxed">
              As classificações deste painel são leitura das conversas por análise automática.
              Nenhum indicador aqui representa matrícula confirmada, receita ou retorno financeiro —
              esses dados dependem do sistema de matrículas e do financeiro, que o {MARCA.produto}{" "}
              não acessa.
            </p>
            <span className="ml-auto whitespace-nowrap">
              Atualizado em {formatarDataHora(painel.data.geradoEm)}
            </span>
          </footer>
        </>
      )}
    </div>
  );
}

export default function PaginaDoFunil() {
  // `useSearchParams` exige limite de Suspense no App Router.
  return (
    <Suspense fallback={<EsqueletoDeBloco linhas={8} />}>
      <ConteudoDoPainel />
    </Suspense>
  );
}
