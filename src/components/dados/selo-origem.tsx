"use client";

/**
 * O componente mais importante da aplicação.
 *
 * Todo dado analítico do SalesHub passa por aqui antes de virar pixel. É o que
 * impede que uma leitura de IA seja apresentada com a mesma autoridade de uma
 * contagem de mensagens — e o que garante que "indício de conversão" nunca seja
 * lido como "venda fechada" numa reunião de diretoria.
 *
 * O selo não é enfeite: ele muda de cor, de texto e de explicação conforme a
 * origem que o **tipo** declara. Quem escreve a tela não escolhe — obedece.
 */

import { Info } from "lucide-react";
import { Badge, type VarianteDoBadge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import {
  EXPLICACAO_ORIGEM,
  ROTULO_CONFIANCA,
  ROTULO_ORIGEM,
  type Classificado,
  type NivelDeConfianca,
  type OrigemDoDado,
} from "@/types";

const VARIANTE_POR_ORIGEM: Record<OrigemDoDado, VarianteDoBadge> = {
  explicito: "positivo",
  inferido: "atencao",
  nao_identificado: "neutro",
  requer_confirmacao_externa: "critico",
};

/** Forma curta usada dentro de tabelas, onde não cabe o rótulo inteiro. */
const SIGLA_POR_ORIGEM: Record<OrigemDoDado, string> = {
  explicito: "Dito",
  inferido: "Inferido",
  nao_identificado: "N/I",
  requer_confirmacao_externa: "Externo",
};

export function SeloDeOrigem({
  origem,
  confianca,
  justificativa,
  compacto = false,
}: {
  origem: OrigemDoDado;
  confianca?: NivelDeConfianca;
  justificativa?: string;
  compacto?: boolean;
}) {
  const explicacao = (
    <div className="space-y-1.5">
      <p className="font-semibold">{ROTULO_ORIGEM[origem]}</p>
      <p className="text-texto-fraco">{EXPLICACAO_ORIGEM[origem]}</p>
      {confianca && (
        <p className="text-texto-fraco">
          Nível declarado pela análise: <strong>{ROTULO_CONFIANCA[confianca]}</strong>.
        </p>
      )}
      {justificativa && <p className="border-borda border-t pt-1.5">{justificativa}</p>}
    </div>
  );

  return (
    <Tooltip conteudo={explicacao}>
      <button
        type="button"
        className="focus:ring-marca/40 cursor-help rounded focus:ring-2 focus:outline-none"
        aria-label={`${ROTULO_ORIGEM[origem]}${confianca ? `, ${ROTULO_CONFIANCA[confianca]}` : ""}`}
      >
        <Badge variante={VARIANTE_POR_ORIGEM[origem]}>
          {compacto ? SIGLA_POR_ORIGEM[origem] : ROTULO_ORIGEM[origem]}
          {confianca && !compacto && (
            <span className="opacity-70">· {ROTULO_CONFIANCA[confianca].split(" ")[0]}</span>
          )}
        </Badge>
      </button>
    </Tooltip>
  );
}

/** Valor + selo, para uso em linha de tabela ou ficha de conversa. */
export function ValorClassificado<T>({
  dado,
  render,
  vazio = "Não identificado",
}: {
  dado: Classificado<T>;
  render: (valor: T) => React.ReactNode;
  vazio?: string;
}) {
  const semDado = dado.origem === "nao_identificado";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={semDado ? "text-texto-fraco italic" : undefined}>
        {semDado ? vazio : render(dado.valor)}
      </span>
      <SeloDeOrigem
        origem={dado.origem}
        confianca={dado.confianca}
        justificativa={dado.justificativa}
        compacto
      />
    </span>
  );
}

/**
 * Aviso fixo de que um bloco inteiro depende de sistema externo.
 *
 * Usado onde a leitura natural do gestor tenderia a "isso é venda": o texto
 * precisa aparecer antes do número, não em nota de rodapé.
 */
export function AvisoDeConfirmacaoExterna({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-200">
      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}
