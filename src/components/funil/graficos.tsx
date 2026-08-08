"use client";

/**
 * Gráficos do painel.
 *
 * Todos com `ResponsiveContainer` e altura fixa — o layout não pode depender do
 * conteúdo para não pular durante o carregamento. Cores vêm de `MARCA`, nunca
 * literais: trocar a identidade é editar um arquivo.
 */

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip as TooltipDoGrafico,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardCabecalho, CardConteudo, CardDescricao, CardTitulo } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EstadoVazio } from "@/components/dados/estados";
import { MARCA } from "@/lib/brand";
import { formatarDiaMes, formatarInteiro, formatarPercentual } from "@/lib/format";
import type { ItemDeDistribuicao, PontoDaSerie } from "@/types";

const EIXO = { fontSize: 11, fill: "currentColor" } as const;

function CaixaDoTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: readonly { name?: string; value?: number; color?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border-borda bg-superficie rounded-controle border px-3 py-2 text-xs shadow-lg">
      {label && <p className="text-texto mb-1 font-medium">{label}</p>}
      {payload.map((linha, i) => (
        <p key={i} className="text-texto-fraco flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ background: linha.color }} />
          {linha.name}: <strong className="text-texto">{formatarInteiro(linha.value ?? 0)}</strong>
        </p>
      ))}
    </div>
  );
}

/**
 * `sinaisComerciais` desliga as duas séries que só descrevem venda — próximo passo
 * e indício de conversão. Em cobrança e atendimento ao aluno elas não são zero:
 * são pergunta errada. Uma linha "indício de conversão" num painel de cobrança
 * convida a interpretação de que a régua comercial vale ali, e ela não vale.
 */
export function GraficoDeVolume({
  serie,
  sinaisComerciais = true,
}: {
  serie: readonly PontoDaSerie[];
  sinaisComerciais?: boolean;
}) {
  const temDado = serie.some((p) => p.conversas > 0);

  return (
    <Card>
      <CardCabecalho>
        <div>
          <CardTitulo>Evolução do volume</CardTitulo>
          <CardDescricao>
            {sinaisComerciais
              ? "Conversas iniciadas por dia e quantas registraram indício de conversão ou próximo passo."
              : "Conversas iniciadas por dia, pela data de início do atendimento."}
          </CardDescricao>
        </div>
      </CardCabecalho>
      <CardConteudo>
        {!temDado ? (
          <EstadoVazio
            titulo="Nenhuma conversa no período"
            descricao="Amplie o intervalo de datas ou remova filtros para ver a evolução."
          />
        ) : (
          <div className="text-texto-fraco h-64">
            <ResponsiveContainer width="100%" height="100%">
              {/* Sem margem negativa à esquerda: ela puxava o eixo Y para fora do
                  SVG e cortava o primeiro dígito de cada rótulo — "320" virava
                  "20", "240" virava "40". O gráfico parecia certo e mentia por um
                  fator de dez. O espaço do eixo é `width` no YAxis, não margem. */}
              <AreaChart data={[...serie]} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="grad-conversas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={MARCA.cores.primaria} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={MARCA.cores.primaria} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  opacity={0.12}
                  vertical={false}
                />
                <XAxis
                  dataKey="data"
                  tickFormatter={formatarDiaMes}
                  tick={EIXO}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                />
                <YAxis
                  tick={EIXO}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                  allowDecimals={false}
                />
                <TooltipDoGrafico
                  content={<CaixaDoTooltip />}
                  labelFormatter={(v) => formatarDiaMes(String(v))}
                />
                {sinaisComerciais && <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />}
                <Area
                  type="monotone"
                  dataKey="conversas"
                  name="Conversas"
                  stroke={MARCA.cores.primaria}
                  strokeWidth={2}
                  fill="url(#grad-conversas)"
                />
                {sinaisComerciais && (
                  <Area
                    type="monotone"
                    dataKey="comProximoPasso"
                    name="Com próximo passo"
                    stroke={MARCA.cores.acento}
                    strokeWidth={1.5}
                    fill="transparent"
                  />
                )}
                {sinaisComerciais && (
                  <Area
                    type="monotone"
                    dataKey="comIndicioDeConversao"
                    name="Com indício de conversão"
                    stroke={MARCA.serie[6]}
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                    fill="transparent"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardConteudo>
    </Card>
  );
}

export function GraficoDeDistribuicao({
  titulo,
  descricao,
  itens,
  vazioTitulo,
  vazioDescricao,
  cores = MARCA.serie,
}: {
  titulo: string;
  descricao: string;
  itens: readonly ItemDeDistribuicao[];
  vazioTitulo: string;
  vazioDescricao: string;
  cores?: readonly string[];
}) {
  const dados = itens.slice(0, 8);

  return (
    <Card>
      <CardCabecalho>
        <div>
          <CardTitulo>{titulo}</CardTitulo>
          <CardDescricao>{descricao}</CardDescricao>
        </div>
        <Badge variante="atencao">Inferido</Badge>
      </CardCabecalho>
      <CardConteudo>
        {!dados.length ? (
          <EstadoVazio titulo={vazioTitulo} descricao={vazioDescricao} />
        ) : (
          <div className="text-texto-fraco h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[...dados]}
                layout="vertical"
                margin={{ top: 4, right: 16, bottom: 0, left: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  opacity={0.12}
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={EIXO}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="rotulo"
                  tick={EIXO}
                  tickLine={false}
                  axisLine={false}
                  width={124}
                />
                <TooltipDoGrafico
                  cursor={{ fill: "currentColor", opacity: 0.06 }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0].payload as ItemDeDistribuicao;
                    return (
                      <div className="border-borda bg-superficie rounded-controle border px-3 py-2 text-xs shadow-lg">
                        <p className="text-texto font-medium">{item.rotulo}</p>
                        <p className="text-texto-fraco">
                          {formatarInteiro(item.total)} conversas ·{" "}
                          {formatarPercentual(item.participacao)}
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="total" name="Conversas" radius={[0, 4, 4, 0]} maxBarSize={22}>
                  {dados.map((item, i) => (
                    <Cell key={item.chave} fill={cores[i % cores.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardConteudo>
    </Card>
  );
}
