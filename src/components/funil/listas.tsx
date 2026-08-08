"use client";

/**
 * Listas acionáveis: conversas que pedem atenção e próximos passos em aberto.
 *
 * São as duas seções que transformam o painel de leitura em trabalho. Por isso
 * cada linha leva à conversa — número agregado sem caminho até a origem é
 * opinião, não informação.
 */

import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";
import { Card, CardCabecalho, CardConteudo, CardDescricao, CardTitulo } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EstadoVazio } from "@/components/dados/estados";
import { formatarDataHora, formatarInteiro } from "@/lib/format";
import {
  ROTULO_MOTIVO_ATENCAO,
  type ConversaComAtencao,
  type LinhaDoRanking,
  type MotivoDeAtencao,
  type OportunidadeEmAberto,
} from "@/types";
import { formatarDuracao } from "@/lib/format";
import { SeloDeOrigem } from "@/components/dados/selo-origem";

const VARIANTE_DO_MOTIVO: Record<MotivoDeAtencao, "critico" | "atencao" | "neutro"> = {
  sem_resposta_do_atendente: "critico",
  proximo_passo_vencido: "critico",
  sentimento_negativo: "atencao",
  objecao_sem_tratamento: "atencao",
  lead_abandonou: "neutro",
};

export function ConversasComAtencao({
  itens,
  mostrarCurso = true,
}: {
  itens: readonly ConversaComAtencao[];
  // Curso de interesse é leitura comercial. Em cobrança, "Curso não identificado"
  // sob toda linha diz que faltou dado — quando na verdade a pergunta não se aplica.
  mostrarCurso?: boolean;
}) {
  return (
    <Card>
      <CardCabecalho>
        <div>
          <CardTitulo>Conversas que pedem atenção</CardTitulo>
          <CardDescricao>
            Situações identificadas na análise que ainda comportam ação.
          </CardDescricao>
        </div>
      </CardCabecalho>
      <CardConteudo>
        {!itens.length ? (
          <EstadoVazio
            titulo="Nada pendente no período"
            descricao="Nenhuma conversa filtrada apresenta sinal de atenção. Ampliar o período pode revelar casos mais antigos."
          />
        ) : (
          <ul className="divide-borda divide-y">
            {itens.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/conversas/${item.id}`}
                  className="hover:bg-fundo-sutil focus:ring-marca/40 flex items-start justify-between gap-3 py-2.5 transition-colors focus:ring-2 focus:outline-none"
                >
                  <div className="min-w-0">
                    <p className="text-texto truncate text-sm font-medium">{item.leadNome}</p>
                    <p className="text-texto-fraco truncate text-xs">{item.detalheDoMotivo}</p>
                    <p className="text-texto-fraco mt-1 text-[11px]">
                      {item.atendenteNome ?? "Sem atendente"}
                      {mostrarCurso ? ` · ${item.cursoNome ?? "Curso não identificado"}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge variante={VARIANTE_DO_MOTIVO[item.motivo]}>
                      {ROTULO_MOTIVO_ATENCAO[item.motivo]}
                    </Badge>
                    <span className="text-texto-fraco text-[11px]">
                      {formatarDataHora(item.ultimaMensagemEm)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardConteudo>
    </Card>
  );
}

export function OportunidadesEmAberto({ itens }: { itens: readonly OportunidadeEmAberto[] }) {
  return (
    <Card>
      <CardCabecalho>
        <div>
          <CardTitulo>Próximos passos em aberto</CardTitulo>
          <CardDescricao>
            Compromissos combinados na conversa e ainda sem desfecho registrado.
          </CardDescricao>
        </div>
        <Badge variante="atencao">Inferido</Badge>
      </CardCabecalho>
      <CardConteudo>
        {!itens.length ? (
          <EstadoVazio
            titulo="Nenhum próximo passo em aberto"
            descricao="A análise não identificou compromissos pendentes nas conversas filtradas."
          />
        ) : (
          <ul className="divide-borda divide-y">
            {itens.map((item) => (
              <li key={item.conversaId}>
                <Link
                  href={`/conversas/${item.conversaId}`}
                  className="hover:bg-fundo-sutil focus:ring-marca/40 flex items-start justify-between gap-3 py-2.5 transition-colors focus:ring-2 focus:outline-none"
                >
                  <div className="min-w-0">
                    <p className="text-texto truncate text-sm font-medium">{item.proximoPasso}</p>
                    <p className="text-texto-fraco truncate text-xs">
                      {item.leadNome} · {item.cursoNome ?? "Curso não identificado"}
                    </p>
                    <p className="text-texto-fraco mt-1 text-[11px]">
                      {item.atendenteNome ?? "Sem atendente"} · {item.etapaDoFunil}
                    </p>
                  </div>
                  <div className="text-texto-fraco flex shrink-0 items-center gap-1 text-[11px]">
                    <Clock className="size-3" aria-hidden="true" />
                    {item.diasEmAberto === 0 ? "hoje" : `${item.diasEmAberto} d`}
                    <ArrowUpRight className="size-3" aria-hidden="true" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardConteudo>
    </Card>
  );
}

/**
 * `colunasComerciais` esconde "próximo passo" e "indício de conversão".
 *
 * Fora do comercial elas não medem nada: a régua de próximo passo foi escrita
 * para negociação, e indício de conversão é o lead dizendo que fechou. Mantê-las
 * zeradas num painel de cobrança faria a equipe parecer improdutiva numa métrica
 * que não é dela.
 */
export function RankingDeAtendentes({
  linhas,
  colunasComerciais = true,
}: {
  linhas: readonly LinhaDoRanking[];
  colunasComerciais?: boolean;
}) {
  return (
    <Card>
      <CardCabecalho>
        <div>
          <CardTitulo>Desempenho conversacional por atendente</CardTitulo>
          <CardDescricao>
            Volume e tempo são medidos nas mensagens; a nota de qualidade é leitura da análise.
          </CardDescricao>
        </div>
      </CardCabecalho>
      <CardConteudo className="p-0">
        {!linhas.length ? (
          <div className="p-4">
            <EstadoVazio
              titulo="Sem atendimento no período"
              descricao="Nenhuma conversa filtrada tem atendente associado."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Desempenho conversacional por atendente</caption>
              <thead>
                <tr className="border-borda text-texto-fraco border-b text-left text-[11px] tracking-wide uppercase">
                  <th scope="col" className="px-4 py-2 font-medium">
                    Atendente
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Equipe
                  </th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">
                    Conversas
                  </th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">
                    1ª resposta
                  </th>
                  {colunasComerciais && (
                    <>
                      <th scope="col" className="px-4 py-2 text-right font-medium">
                        Próx. passo
                      </th>
                      <th scope="col" className="px-4 py-2 text-right font-medium">
                        Indício conv.
                      </th>
                    </>
                  )}
                  <th scope="col" className="px-4 py-2 text-right font-medium">
                    Qualidade
                  </th>
                </tr>
              </thead>
              <tbody className="divide-borda divide-y">
                {linhas.map((linha) => (
                  <tr key={linha.atendenteId} className="hover:bg-fundo-sutil transition-colors">
                    {/* Sem nome, mostra o id. Célula vazia parece defeito de
                        renderização e esconde que a linha tem dados válidos —
                        o id ao menos identifica a pessoa e é rastreável. */}
                    <td className="text-texto px-4 py-2.5 font-medium">
                      {linha.atendenteNome ?? (
                        <span className="text-texto-fraco font-normal">
                          Atendente {linha.atendenteId}
                        </span>
                      )}
                    </td>
                    <td className="text-texto-fraco px-4 py-2.5">{linha.equipeNome || "—"}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {formatarInteiro(linha.conversas)}
                    </td>
                    <td className="text-texto-fraco px-4 py-2.5 text-right tabular-nums">
                      {formatarDuracao(linha.tempoMedioPrimeiraRespostaSegundos)}
                    </td>
                    {colunasComerciais && (
                      <>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          {formatarInteiro(linha.comProximoPasso)}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          {formatarInteiro(linha.comIndicioDeConversao)}
                        </td>
                      </>
                    )}
                    <td className="px-4 py-2.5">
                      <span className="flex items-center justify-end gap-1.5 tabular-nums">
                        {linha.qualidadeMedia.valor === null
                          ? "—"
                          : formatarInteiro(linha.qualidadeMedia.valor)}
                        <SeloDeOrigem
                          origem={linha.qualidadeMedia.origem}
                          confianca={linha.qualidadeMedia.confianca}
                          justificativa={linha.qualidadeMedia.justificativa}
                          compacto
                        />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardConteudo>
    </Card>
  );
}
