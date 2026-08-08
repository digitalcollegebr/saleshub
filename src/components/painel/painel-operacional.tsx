"use client";

/**
 * Painel de uma operação que não é a comercial.
 *
 * **Por que não é o painel do funil com outro filtro.** O painel comercial mede
 * uma progressão: etapa, objeção, próximo passo, indício de conversão. Cobrança e
 * atendimento ao aluno não têm funil — a conversa de cobrança termina em acordo ou
 * não termina, e a de suporte termina em problema resolvido ou não. Reaproveitar a
 * régua comercial ali produziria "taxa de avanço" e "objeções" sobre conversas que
 * nunca foram negociação: número plausível medindo a pergunta errada, que é o modo
 * mais caro de errar num painel.
 *
 * O que fica, então, é o que é **medido** — volume, tempo até a primeira resposta,
 * conversa sem resposta — mais duas leituras que valem em qualquer atendimento:
 * sentimento e qualidade. Nada aqui foi inventado para preencher espaço.
 *
 * O recorte por departamento não vem daqui: vem do `ProvedorDeDepartamento` que a
 * página monta em volta, e entra em `useFiltros` → `queryKey` → API.
 */

import { AlertTriangle } from "lucide-react";
import { BarraDeFiltros } from "@/components/filtros/barra-de-filtros";
import { CartaoIndicador } from "@/components/dados/cartao-indicador";
import {
  EsqueletoDeBloco,
  EsqueletoDeCartao,
  EstadoDeErro,
  EstadoVazio,
} from "@/components/dados/estados";
import { GraficoDeDistribuicao, GraficoDeVolume } from "@/components/funil/graficos";
import { ConversasComAtencao, RankingDeAtendentes } from "@/components/funil/listas";
import { useConversasComAtencao, usePainelDoFunil } from "@/hooks/use-dados";
import { useFiltros } from "@/hooks/use-filtros";
import { MARCA } from "@/lib/brand";
import { formatarDataHora } from "@/lib/format";

/**
 * Indicadores que descrevem atendimento, não venda.
 *
 * Lista fechada por chave, não filtro por `classe`: "medida" traria qualquer
 * indicador medido que o coletor venha a acrescentar, inclusive um comercial. Aqui
 * a escolha é explícita, e acrescentar um é uma decisão, não um efeito colateral.
 */
const INDICADORES_DE_ATENDIMENTO = ["conversas", "primeira_resposta", "sem_resposta", "qualidade"];

export function PainelOperacional({ titulo, descricao }: { titulo: string; descricao: string }) {
  const { filtros, limpar, quantidadeAtiva } = useFiltros();
  const painel = usePainelDoFunil(filtros);
  const atencao = useConversasComAtencao(filtros);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-texto text-lg font-semibold">{titulo}</h1>
        <p className="text-texto-fraco mt-0.5 max-w-3xl text-xs leading-relaxed">{descricao}</p>
      </header>

      <BarraDeFiltros />

      {painel.isError ? (
        <EstadoDeErro erro={painel.error} aoTentarNovamente={() => painel.refetch()} />
      ) : painel.isPending ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <EsqueletoDeCartao key={i} altura="h-[7.5rem]" />
            ))}
          </div>
          <div className="grid gap-4 xl:grid-cols-[3fr_2fr]">
            <EsqueletoDeCartao altura="h-[22rem]" />
            <EsqueletoDeCartao altura="h-[22rem]" />
          </div>
        </div>
      ) : painel.data.totalDeConversasNoPeriodo === 0 ? (
        <EstadoVazio
          titulo="Nenhuma conversa desta área no recorte"
          descricao={
            quantidadeAtiva > 0
              ? "Os filtros aplicados não retornaram conversas desta área. Isso não significa ausência de atendimento — significa que este corte está vazio."
              : "Não há conversas classificadas nesta área no período selecionado. Conversas ainda não reclassificadas contam como não identificadas e não aparecem aqui."
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
              {painel.data.indicadores
                .filter((i) => INDICADORES_DE_ATENDIMENTO.includes(i.chave))
                .map((indicador) => (
                  <CartaoIndicador key={indicador.chave} indicador={indicador} />
                ))}
            </div>
          </section>

          <div className="grid gap-4 xl:grid-cols-[3fr_2fr]">
            <GraficoDeVolume serie={painel.data.serieDeVolume} sinaisComerciais={false} />
            <GraficoDeDistribuicao
              titulo="Sentimento do contato"
              descricao="Tom predominante de quem procurou. O percentual é sobre as conversas que já têm leitura de sentimento, não sobre o período."
              itens={painel.data.sentimentos}
              vazioTitulo="Sem leitura de sentimento"
              vazioDescricao="Não há conversas suficientes para uma leitura de sentimento."
              cores={[MARCA.cores.acento, MARCA.serie[5], MARCA.serie[4]]}
            />
          </div>

          <RankingDeAtendentes linhas={painel.data.ranking} colunasComerciais={false} />

          {atencao.isError ? (
            <EstadoDeErro erro={atencao.error} aoTentarNovamente={() => atencao.refetch()} />
          ) : atencao.isPending ? (
            <EsqueletoDeBloco linhas={6} />
          ) : (
            <ConversasComAtencao itens={atencao.data} mostrarCurso={false} />
          )}

          <footer className="border-borda text-texto-fraco flex flex-wrap items-center gap-2 border-t pt-3 text-[11px]">
            <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
            <p className="max-w-4xl leading-relaxed">
              A área de cada conversa é leitura automática do conteúdo, não um campo preenchido no
              SZ Chat. Conversa cuja área não pôde ser determinada com segurança fica como não
              identificada e não entra neste recorte — some deste painel, não do sistema.
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
