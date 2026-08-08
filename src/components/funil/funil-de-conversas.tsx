"use client";

/**
 * Funil conversacional.
 *
 * Escolha deliberada: barras horizontais proporcionais, não o gráfico de funil
 * afunilado clássico. Três razões — as etapas terminais ("sem resposta", "sem
 * interesse") não pertencem à progressão e um funil desenhado as empurraria para
 * o fundo como se fossem estágio final; a taxa de avanço precisa aparecer entre
 * etapas vizinhas, o que exige linhas alinhadas; e são 14 etapas, densidade em
 * que o funil triangular vira faixa ilegível.
 *
 * As etapas de progressão e as de encerramento ficam separadas por um divisor:
 * somar as duas num só eixo é o erro que faz gestor ler "12% de conversão".
 */

import Link from "next/link";
import { Card, CardCabecalho, CardConteudo, CardDescricao, CardTitulo } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import { AvisoDeConfirmacaoExterna } from "@/components/dados/selo-origem";
import { formatarInteiro, formatarPercentual } from "@/lib/format";
import type { EtapaDoFunilComVolume } from "@/types";

function LinhaDaEtapa({
  etapa,
  maximo,
  href,
}: {
  etapa: EtapaDoFunilComVolume;
  maximo: number;
  href: string;
}) {
  // A barra mede quem ALCANÇOU a etapa, não quem está parado nela: é o acumulado
  // que dá ao gráfico a forma decrescente de um funil. O número de parados vem ao
  // lado, porque é ele que diz onde a operação precisa agir.
  const base = etapa.terminal ? etapa.conversas : etapa.alcancaram;
  const largura = maximo > 0 ? Math.max((base / maximo) * 100, base > 0 ? 2 : 0) : 0;

  return (
    <Tooltip
      conteudo={
        <div className="space-y-1.5">
          <p className="font-semibold">{etapa.rotulo}</p>
          <p className="text-texto-fraco">{etapa.descricao}</p>
          <div className="border-borda space-y-0.5 border-t pt-1.5">
            {!etapa.terminal && (
              <p>
                <strong>{formatarInteiro(etapa.alcancaram)}</strong> conversas alcançaram esta etapa
                ({formatarPercentual(etapa.participacao)} do período).
              </p>
            )}
            <p className="text-texto-fraco">
              <strong>{formatarInteiro(etapa.conversas)}</strong>{" "}
              {etapa.terminal ? "conversas terminaram aqui" : "estão paradas aqui agora"}.
            </p>
          </div>
          {etapa.taxaDeAvanco !== null && (
            <p className="text-texto-fraco">
              {formatarPercentual(etapa.taxaDeAvanco)} de quem chegou à etapa anterior avançou até
              aqui.
            </p>
          )}
        </div>
      }
    >
      <Link
        href={href}
        className="hover:bg-fundo-sutil focus:ring-marca/40 rounded-controle grid grid-cols-[minmax(8rem,12rem)_1fr_auto] items-center gap-3 px-1 py-1.5 transition-colors focus:ring-2 focus:outline-none"
      >
        <span className="text-texto truncate text-xs font-medium" title={etapa.rotulo}>
          {etapa.rotulo}
        </span>

        <span className="flex h-5 items-center">
          <span
            className="h-2.5 rounded-full transition-all"
            style={{
              width: `${largura}%`,
              backgroundColor: etapa.cor,
              minWidth: etapa.conversas ? 6 : 0,
            }}
            aria-hidden="true"
          />
        </span>

        <span className="flex items-baseline gap-2 tabular-nums">
          <span className="text-texto text-sm font-semibold">{formatarInteiro(base)}</span>
          <span className="text-texto-fraco w-20 text-right text-[11px]">
            {etapa.terminal
              ? ""
              : etapa.taxaDeAvanco !== null
                ? `↳ ${formatarPercentual(etapa.taxaDeAvanco, 0)}`
                : ""}
          </span>
          <span className="text-texto-fraco w-16 text-right text-[11px]">
            {!etapa.terminal && etapa.conversas > 0
              ? `${formatarInteiro(etapa.conversas)} aqui`
              : ""}
          </span>
        </span>
      </Link>
    </Tooltip>
  );
}

export function FunilDeConversas({
  etapas,
  hrefDaEtapa,
}: {
  etapas: readonly EtapaDoFunilComVolume[];
  hrefDaEtapa: (chave: string) => string;
}) {
  const progressao = etapas.filter((e) => !e.terminal).sort((a, b) => a.ordem - b.ordem);
  const encerramentos = etapas.filter((e) => e.terminal).sort((a, b) => b.conversas - a.conversas);
  // Escala pelo acumulado da primeira etapa: é o topo do funil e o maior valor
  // possível. Usar o pico das "paradas" faria a barra do topo parecer menor que a
  // de uma etapa intermediária congestionada.
  const maximo = Math.max(...etapas.map((e) => (e.terminal ? e.conversas : e.alcancaram)), 1);

  return (
    <Card>
      <CardCabecalho>
        <div>
          <CardTitulo>Funil de conversas</CardTitulo>
          <CardDescricao>
            Etapas inferidas do conteúdo das conversas — não é o funil oficial de matrículas. A
            barra mostra quantas <strong>alcançaram</strong> a etapa; à direita, quantas estão
            paradas nela agora.
          </CardDescricao>
        </div>
      </CardCabecalho>

      <CardConteudo className="space-y-4">
        <div className="space-y-0.5">
          {progressao.map((etapa) => (
            <LinhaDaEtapa
              key={etapa.chave}
              etapa={etapa}
              maximo={maximo}
              href={hrefDaEtapa(etapa.chave)}
            />
          ))}
        </div>

        <AvisoDeConfirmacaoExterna>
          <strong>Indício de conversão</strong> significa que o lead afirmou ter concluído a
          matrícula. Confirmar depende do sistema de matrículas, que o SalesHub não acessa — o
          número acima não deve ser lido como venda realizada.
        </AvisoDeConfirmacaoExterna>

        <div className="border-borda space-y-0.5 border-t pt-3">
          <p className="text-texto-fraco px-1 pb-1 text-[11px] font-medium tracking-wide uppercase">
            Encerramentos — fora da progressão
          </p>
          {encerramentos.map((etapa) => (
            <LinhaDaEtapa
              key={etapa.chave}
              etapa={etapa}
              maximo={maximo}
              href={hrefDaEtapa(etapa.chave)}
            />
          ))}
        </div>
      </CardConteudo>
    </Card>
  );
}
