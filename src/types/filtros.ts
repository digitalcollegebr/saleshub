/** Filtros do painel. Serializáveis para URL — o estado de um painel é um link. */

export interface FiltrosDoPainel {
  readonly periodoInicio: string;
  readonly periodoFim: string;
  readonly unidadeId?: string;
  readonly equipeId?: string;
  readonly atendenteId?: string;
  readonly campanhaId?: string;
  readonly canal?: string;
  readonly cursoId?: string;
  readonly etapaDoFunil?: string;
  /**
   * Área responsável pela conversa. Não vem da barra de filtros: é fixado pela
   * página (`/funil` é comercial, `/cobranca` é cobrança) via
   * `ContextoDeDepartamento`. Ausente significa "sem recorte", e quem decide se o
   * painel comercial se restringe é a flag do coletor — ver `_condicoes` lá.
   */
  readonly departamento?: string;
}

export interface OpcoesDeFiltro {
  readonly unidades: readonly { id: string; nome: string }[];
  readonly equipes: readonly { id: string; nome: string; unidadeId: string }[];
  readonly atendentes: readonly { id: string; nome: string; equipeId: string }[];
  readonly campanhas: readonly { id: string; nome: string }[];
  readonly cursos: readonly { id: string; nome: string }[];
  readonly canais: readonly { id: string; nome: string }[];
  readonly etapas: readonly { id: string; nome: string }[];
}

export interface Paginacao {
  readonly pagina: number;
  readonly porPagina: number;
}

export interface Pagina<T> {
  readonly itens: readonly T[];
  readonly total: number;
  readonly pagina: number;
  readonly porPagina: number;
}
