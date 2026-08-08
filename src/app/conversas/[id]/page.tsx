"use client";

/**
 * Uma conversa, do começo ao fim.
 *
 * É o destino de todo link do painel — cartão de indicador, etapa do funil, item
 * de "pedem atenção". O painel diz *que* algo aconteceu; esta tela é onde se vê
 * **o que foi dito**, e é ela que permite discordar da análise: a transcrição
 * fica ao lado da leitura da IA, não atrás dela.
 *
 * Por isso a ordem: transcrição à esquerda (o fato), análise à direita (a
 * interpretação). Quem abre a tela para conferir uma classificação encontra a
 * evidência antes do rótulo.
 */

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Bot, Clock, Headset, MessageSquare, Settings, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardCabecalho, CardConteudo, CardDescricao, CardTitulo } from "@/components/ui/card";
import { EsqueletoDeBloco, EstadoDeErro, EstadoVazio } from "@/components/dados/estados";
import { SeloDeOrigem } from "@/components/dados/selo-origem";
import { useConversa } from "@/hooks/use-dados";
import { formatarDataHora, formatarDuracao, formatarInteiro } from "@/lib/format";
import type { AnaliseDaConversa, Classificado, MensagemDaConversa } from "@/types";

const AUTOR = {
  lead: { rotulo: "Lead", Icone: User, alinhaDireita: false },
  atendente: { rotulo: "Atendente", Icone: Headset, alinhaDireita: true },
  bot: { rotulo: "Automação", Icone: Bot, alinhaDireita: true },
  sistema: { rotulo: "Sistema", Icone: Settings, alinhaDireita: false },
} as const;

function Balao({ mensagem }: { mensagem: MensagemDaConversa }) {
  const { rotulo, Icone, alinhaDireita } = AUTOR[mensagem.autor] ?? AUTOR.sistema;
  return (
    <li className={`flex gap-2 ${alinhaDireita ? "flex-row-reverse" : ""}`}>
      <div className="text-texto-fraco mt-1 shrink-0" title={rotulo}>
        <Icone className="size-4" aria-hidden="true" />
        <span className="sr-only">{rotulo}</span>
      </div>
      <div className={`max-w-[80%] ${alinhaDireita ? "text-right" : ""}`}>
        <div
          className={`inline-block rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
            alinhaDireita ? "bg-marca/10 text-texto" : "bg-fundo-sutil text-texto"
          }`}
        >
          {mensagem.texto || <span className="text-texto-fraco italic">(sem texto)</span>}
          {mensagem.tipoDeMidia && (
            <span className="text-texto-fraco ml-2 text-[11px]">[{mensagem.tipoDeMidia}]</span>
          )}
        </div>
        <p className="text-texto-fraco mt-0.5 text-[11px]">
          {rotulo} · {formatarDataHora(mensagem.enviadaEm)}
        </p>
      </div>
    </li>
  );
}

/** Um campo da análise com o selo que o tipo determina. Nada aqui escolhe rótulo. */
function LinhaDaAnalise({ rotulo, campo }: { rotulo: string; campo?: Classificado<unknown> }) {
  if (!campo) return null;
  const valor = campo.valor;
  const vazio =
    valor === null ||
    valor === undefined ||
    valor === "" ||
    (Array.isArray(valor) && !valor.length);

  return (
    <div className="border-borda border-b py-2 last:border-0">
      <div className="flex items-start justify-between gap-2">
        <span className="text-texto-fraco text-[11px] tracking-wide uppercase">{rotulo}</span>
        <SeloDeOrigem
          origem={campo.origem}
          confianca={campo.confianca}
          justificativa={campo.justificativa}
          compacto
        />
      </div>
      <p className="text-texto mt-1 text-sm">
        {vazio ? (
          <span className="text-texto-fraco">Não identificado</span>
        ) : Array.isArray(valor) ? (
          valor.map((v) => String((v as { rotulo?: string })?.rotulo ?? v)).join(", ")
        ) : (
          String(valor)
        )}
      </p>
    </div>
  );
}

export default function PaginaDaConversa({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const consulta = useConversa(id);

  if (consulta.isError) {
    // Erro sem saída é beco: numa conversa que não existe, "Tentar novamente" não
    // resolve e o único caminho útil é voltar para a lista. O botão de repetir
    // continua aparecendo quando repetir adianta — quem decide é o `ErroDaApi`.
    return (
      <div className="space-y-3">
        <EstadoDeErro erro={consulta.error} aoTentarNovamente={() => consulta.refetch()} />
        <Link
          href="/conversas"
          className="border-borda text-texto-fraco hover:bg-fundo-sutil inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Voltar para as conversas
        </Link>
      </div>
    );
  }
  if (consulta.isPending) return <EsqueletoDeBloco linhas={10} />;

  const c = consulta.data;
  const analise = (c.analise ?? {}) as Partial<AnaliseDaConversa>;
  const semAnalise = Object.keys(analise).length === 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/conversas"
          className="border-borda text-texto-fraco hover:bg-fundo-sutil inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Conversas
        </Link>
        <h1 className="text-texto text-lg font-semibold">{c.lead?.nome || "Sem nome"}</h1>
        {c.protocolo && <Badge variante="neutro">Protocolo {c.protocolo}</Badge>}
      </div>

      <div className="grid gap-4 xl:grid-cols-[3fr_2fr]">
        <Card>
          <CardCabecalho>
            <div>
              <CardTitulo>Transcrição</CardTitulo>
              <CardDescricao>
                O que foi dito, na ordem em que foi dito. É a evidência sobre a qual a análise ao
                lado foi construída.
              </CardDescricao>
            </div>
          </CardCabecalho>
          <CardConteudo>
            {!c.mensagens?.length ? (
              <EstadoVazio
                titulo="Sem mensagens registradas"
                descricao="O coletor não recebeu o conteúdo desta conversa."
              />
            ) : (
              <ul className="space-y-3">
                {c.mensagens.map((m) => (
                  <Balao key={m.id} mensagem={m} />
                ))}
              </ul>
            )}
          </CardConteudo>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardCabecalho>
              <CardTitulo>Do atendimento</CardTitulo>
            </CardCabecalho>
            <CardConteudo>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-texto-fraco text-[11px] uppercase">Iniciada</dt>
                  <dd className="text-texto">{formatarDataHora(c.iniciadaEm)}</dd>
                </div>
                <div>
                  <dt className="text-texto-fraco text-[11px] uppercase">Última mensagem</dt>
                  <dd className="text-texto">{formatarDataHora(c.ultimaMensagemEm)}</dd>
                </div>
                <div>
                  <dt className="text-texto-fraco text-[11px] uppercase">Mensagens</dt>
                  <dd className="text-texto flex items-center gap-1">
                    <MessageSquare className="size-3.5" aria-hidden="true" />
                    {formatarInteiro(c.metricas?.totalDeMensagens ?? 0)}
                    <span className="text-texto-fraco text-xs">
                      ({formatarInteiro(c.metricas?.mensagensDoLead ?? 0)} do lead)
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-texto-fraco text-[11px] uppercase">1ª resposta</dt>
                  <dd className="text-texto flex items-center gap-1">
                    <Clock className="size-3.5" aria-hidden="true" />
                    {formatarDuracao(c.metricas?.tempoAtePrimeiraRespostaSegundos)}
                  </dd>
                </div>
                {c.lead?.telefone && (
                  <div>
                    <dt className="text-texto-fraco text-[11px] uppercase">Telefone</dt>
                    <dd className="text-texto">{c.lead.telefone}</dd>
                  </div>
                )}
                {c.encerradaEm && (
                  <div>
                    <dt className="text-texto-fraco text-[11px] uppercase">Encerrada</dt>
                    <dd className="text-texto">{formatarDataHora(c.encerradaEm)}</dd>
                  </div>
                )}
              </dl>
            </CardConteudo>
          </Card>

          <Card>
            <CardCabecalho>
              <div>
                <CardTitulo>Leitura da análise</CardTitulo>
                <CardDescricao>
                  Interpretação automática da conversa ao lado. Cada campo carrega de onde veio.
                </CardDescricao>
              </div>
            </CardCabecalho>
            <CardConteudo>
              {semAnalise ? (
                <EstadoVazio
                  titulo="Ainda não classificada"
                  descricao="Esta conversa está na fila de análise. Os campos aparecem assim que ela for processada."
                />
              ) : (
                <div>
                  <LinhaDaAnalise rotulo="Resumo" campo={analise.resumo} />
                  <LinhaDaAnalise rotulo="Etapa do funil" campo={analise.etapaDoFunil} />
                  <LinhaDaAnalise rotulo="Intenção de compra" campo={analise.intencaoDeCompra} />
                  <LinhaDaAnalise rotulo="Sentimento" campo={analise.sentimento} />
                  <LinhaDaAnalise rotulo="Objeções" campo={analise.objecoes} />
                  <LinhaDaAnalise rotulo="Próximo passo" campo={analise.proximoPasso} />
                  <LinhaDaAnalise
                    rotulo="Indício de conversão"
                    campo={analise.indicioDeConversao}
                  />
                </div>
              )}
            </CardConteudo>
          </Card>
        </div>
      </div>
    </div>
  );
}
