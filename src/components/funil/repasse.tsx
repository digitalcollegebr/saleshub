"use client";

/**
 * Do chatbot de qualificação (SDR) ao consultor de carreira.
 *
 * O lead chega no chatbot, que qualifica, e só então é repassado a uma pessoa.
 * São duas operações em sequência dentro da mesma conversa — e o painel tratava
 * as duas como uma só, o que apagava o degrau entre elas: conversa em que só o
 * robô falou aparecia atendida, com tempo de resposta de um segundo.
 *
 * A seção fica **antes** do funil de etapas de propósito. O funil descreve a
 * negociação; se o lead não chegou a um consultor, não houve negociação para
 * descrever — a pergunta anterior é se ele chegou.
 *
 * Tudo aqui é `medida`. Nenhum número desta seção diz se a qualificação foi boa:
 * isso exigiria ler a conversa, e é outra pergunta.
 */

import { CartaoIndicador } from "@/components/dados/cartao-indicador";
import { Card, CardCabecalho, CardConteudo, CardDescricao, CardTitulo } from "@/components/ui/card";
import { EstadoVazio } from "@/components/dados/estados";
import { formatarInteiro, formatarPercentual } from "@/lib/format";
import { MARCA } from "@/lib/brand";
import type { RepasseParaConsultor } from "@/types";

export function RepasseParaOConsultor({
  repasse,
  hrefDoIndicador,
}: {
  repasse: RepasseParaConsultor;
  hrefDoIndicador?: (filtro: Record<string, string>) => string;
}) {
  const faixas = repasse.tempoAteOConsultor;
  const repassados = faixas.reduce((soma, f) => soma + f.total, 0);

  return (
    <section aria-label="Repasse do SDR para o consultor" className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {repasse.indicadores.map((indicador) => (
          <CartaoIndicador
            key={indicador.chave}
            indicador={indicador}
            href={
              indicador.filtroDeOrigem && hrefDoIndicador
                ? hrefDoIndicador(indicador.filtroDeOrigem)
                : undefined
            }
          />
        ))}
      </div>

      <Card>
        <CardCabecalho>
          <div>
            <CardTitulo>Quanto o lead espera pelo consultor</CardTitulo>
            <CardDescricao>
              Tempo entre a primeira mensagem do lead e a primeira mensagem de uma pessoa. A
              saudação do robô não conta — ela chega em segundos e apagaria a espera real.
            </CardDescricao>
          </div>
        </CardCabecalho>
        <CardConteudo>
          {repassados === 0 ? (
            <EstadoVazio
              titulo="Nenhuma conversa chegou a um consultor"
              descricao="Sem repasse não há espera para medir. As conversas do período pararam no SDR."
            />
          ) : (
            <ul className="space-y-2">
              {faixas.map((faixa) => (
                <li key={faixa.chave} className="flex items-center gap-3">
                  <span className="text-texto-fraco w-28 shrink-0 text-xs">{faixa.rotulo}</span>
                  <div className="bg-fundo-sutil h-2 flex-1 overflow-hidden rounded-full">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${faixa.participacao}%`,
                        background: MARCA.cores.primaria,
                      }}
                    />
                  </div>
                  <span className="text-texto w-12 shrink-0 text-right text-sm tabular-nums">
                    {formatarInteiro(faixa.total)}
                  </span>
                  <span className="text-texto-fraco w-14 shrink-0 text-right text-xs tabular-nums">
                    {formatarPercentual(faixa.participacao)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardConteudo>
      </Card>
    </section>
  );
}
