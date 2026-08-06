/**
 * A distinção entre fato e inferência é tipo, não convenção de interface.
 *
 * O SalesHub lê conversas, não sistemas transacionais. Quase tudo que interessa a
 * um gestor — etapa do funil, intenção de compra, motivo de perda — é **leitura
 * de texto por IA**, não registro de sistema. Se essa diferença ficasse a cargo de
 * quem escreve o componente, um esquecimento bastaria para um palpite virar número
 * oficial numa reunião de diretoria.
 *
 * Por isso todo valor analítico trafega embrulhado em `Classificado<T>`: a origem
 * viaja junto com o dado, e a interface renderiza o que o tipo já declara.
 */

/** De onde veio a informação — determina como ela pode ser apresentada. */
export type OrigemDoDado =
  /** Dito com todas as letras na conversa. É citação, não interpretação. */
  | "explicito"
  /** Deduzido do contexto pela análise. É opinião fundamentada da IA. */
  | "inferido"
  /** A conversa não permite concluir. Ausência é informação: não vira zero. */
  | "nao_identificado"
  /** Só um sistema transacional confirma (matrícula, pagamento, receita). */
  | "requer_confirmacao_externa";

export type NivelDeConfianca = "alta" | "media" | "baixa";

/**
 * Trecho da conversa que sustenta uma classificação.
 *
 * Classificação sem evidência é achismo com aparência de dado. Sempre que a
 * análise conseguir apontar o trecho, ele viaja junto para a interface poder
 * mostrar *por que* concluiu aquilo.
 */
export interface EvidenciaDeClassificacao {
  readonly mensagemId: string;
  readonly trecho: string;
  readonly autor: "lead" | "atendente";
  readonly enviadaEm: string;
}

export interface Classificado<T> {
  readonly valor: T;
  readonly origem: OrigemDoDado;
  readonly confianca?: NivelDeConfianca;
  readonly evidencias?: readonly EvidenciaDeClassificacao[];
  /** Como a análise chegou nisso, em uma frase, para exibir no tooltip. */
  readonly justificativa?: string;
}

/** Açúcar para o caso comum: número medido diretamente das mensagens. */
export function fato<T>(valor: T): Classificado<T> {
  return { valor, origem: "explicito", confianca: "alta" };
}

export function inferido<T>(
  valor: T,
  confianca: NivelDeConfianca,
  extra?: Partial<Omit<Classificado<T>, "valor" | "origem" | "confianca">>,
): Classificado<T> {
  return { valor, origem: "inferido", confianca, ...extra };
}

export function naoIdentificado<T>(valorPadrao: T): Classificado<T> {
  return { valor: valorPadrao, origem: "nao_identificado" };
}

export const ROTULO_ORIGEM: Record<OrigemDoDado, string> = {
  explicito: "Dito na conversa",
  inferido: "Inferido pela análise",
  nao_identificado: "Não identificado",
  requer_confirmacao_externa: "Depende de confirmação externa",
};

export const EXPLICACAO_ORIGEM: Record<OrigemDoDado, string> = {
  explicito:
    "Informação dita com todas as letras na conversa. É citação do que foi escrito, não interpretação.",
  inferido:
    "Conclusão da análise a partir do contexto da conversa. É uma leitura fundamentada, não um registro de sistema.",
  nao_identificado:
    "A conversa não permite concluir. Ausência de informação não é o mesmo que resultado negativo.",
  requer_confirmacao_externa:
    "Só um sistema transacional (matrícula, financeiro) confirma. O SalesHub mostra o indício, nunca o fato consumado.",
};

export const ROTULO_CONFIANCA: Record<NivelDeConfianca, string> = {
  alta: "Alta confiança",
  media: "Média confiança",
  baixa: "Baixa confiança",
};
