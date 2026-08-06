/**
 * Formatos de saída do painel.
 *
 * Toda métrica declara a que classe pertence — `medida` (contada nas mensagens)
 * ou `inferida` (lida por IA). O card não escolhe como se apresentar: ele obedece
 * ao que a métrica diz sobre si.
 */

import type { Classificado, NivelDeConfianca, OrigemDoDado } from "./classificacao";

export type ClasseDeMetrica = "medida" | "inferida";

export interface Indicador {
  readonly chave: string;
  readonly rotulo: string;
  readonly valor: number;
  readonly formato: "inteiro" | "percentual" | "duracao_segundos" | "decimal";
  readonly classe: ClasseDeMetrica;
  /** Contexto para o tooltip: o que este número significa e o que ele NÃO diz. */
  readonly explicacao: string;
  readonly variacaoPercentual?: number;
  readonly confiancaMedia?: NivelDeConfianca;
  /** Filtro que a interface aplica ao navegar do card para as conversas. */
  readonly filtroDeOrigem?: Record<string, string>;
}

export interface EtapaDoFunilComVolume {
  readonly chave: string;
  readonly rotulo: string;
  readonly cor: string;
  readonly ordem: number;
  readonly terminal: boolean;
  readonly descricao: string;

  /**
   * Conversas **paradas** nesta etapa agora. É uma foto do momento: cada conversa
   * aparece em exatamente uma etapa.
   */
  readonly conversas: number;

  /**
   * Conversas que **alcançaram pelo menos** esta etapa — a soma desta com todas as
   * seguintes na progressão.
   *
   * Sem esta distinção o funil mente. Dividir a foto de uma etapa pela foto da
   * anterior produz "taxa de avanço" acima de 100% sempre que uma etapa acumula
   * mais conversas paradas que a anterior — chegamos a exibir 152%, o que sugere
   * que mais gente avançou do que existia. Progressão só se mede sobre acumulado.
   */
  readonly alcancaram: number;

  /** Participação de `alcancaram` sobre o total de conversas do período. */
  readonly participacao: number;

  /** `alcancaram` desta etapa sobre o da anterior. Nunca passa de 100%. */
  readonly taxaDeAvanco: number | null;

  readonly confiancaPredominante: NivelDeConfianca;
}

export interface PontoDaSerie {
  readonly data: string;
  readonly conversas: number;
  readonly comIndicioDeConversao: number;
  readonly comProximoPasso: number;
}

export interface ItemDeDistribuicao {
  readonly chave: string;
  readonly rotulo: string;
  readonly total: number;
  readonly participacao: number;
  readonly origem: OrigemDoDado;
}

export interface LinhaDoRanking {
  readonly atendenteId: string;
  readonly atendenteNome: string;
  readonly equipeNome: string;
  readonly conversas: number;
  readonly tempoMedioPrimeiraRespostaSegundos: number | null;
  readonly comProximoPasso: number;
  readonly comIndicioDeConversao: number;
  readonly qualidadeMedia: Classificado<number>;
}

export interface OportunidadeEmAberto {
  readonly conversaId: string;
  readonly leadNome: string;
  readonly atendenteNome: string | null;
  readonly cursoNome: string | null;
  readonly proximoPasso: string;
  readonly prazo: string | null;
  readonly diasEmAberto: number;
  readonly etapaDoFunil: string;
}

/** Tudo que o dashboard precisa, numa requisição. */
export interface PainelDoFunil {
  readonly indicadores: readonly Indicador[];
  readonly funil: readonly EtapaDoFunilComVolume[];
  readonly serieDeVolume: readonly PontoDaSerie[];
  readonly objecoes: readonly ItemDeDistribuicao[];
  readonly cursos: readonly ItemDeDistribuicao[];
  readonly sentimentos: readonly ItemDeDistribuicao[];
  readonly ranking: readonly LinhaDoRanking[];
  readonly geradoEm: string;
  readonly totalDeConversasNoPeriodo: number;
}
