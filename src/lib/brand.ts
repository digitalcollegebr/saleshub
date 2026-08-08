/**
 * Identidade visual, num arquivo só.
 *
 * A identidade da Digital College aqui é **provisória**: nome, cores, logo e
 * assinatura ficam centralizados para que trocar a marca seja editar este arquivo,
 * não caçar hex code em vinte componentes. Os tokens viram variáveis CSS em
 * `globals.css` — nenhum componente escreve cor literal.
 */

export const MARCA = {
  produto: "SalesHub",
  descricao: "Conversation Analytics comercial",
  organizacao: "Digital College",
  // Sem "do time comercial": a mesma barra lateral serve cobrança e atendimento ao
  // aluno desde que as conversas passaram a ser separadas por área.
  assinatura: "Análises construídas sobre as conversas atendidas no SZ Chat",

  /** Iniciais do logotipo enquanto não há arquivo de imagem definitivo. */
  monograma: "DC",

  cores: {
    /** Azul institucional — usado com parcimônia, em ação e destaque. */
    primaria: "#1d4ed8",
    primariaClara: "#eff4ff",
    primariaEscura: "#1e3a8a",
    /** Acento de apoio para séries secundárias em gráficos. */
    acento: "#0f766e",
  },

  /**
   * Semântica de dado — separada da cor de marca de propósito. Estas cores
   * comunicam *natureza da informação*, e confundi-las com a identidade faria a
   * interface parecer decorada quando ela está, na verdade, sinalizando.
   */
  semantica: {
    explicito: "#0f766e",
    inferido: "#a16207",
    naoIdentificado: "#64748b",
    requerConfirmacao: "#b45309",
    atencao: "#b91c1c",
  },

  /** Paleta ordenada para gráficos categóricos. */
  serie: ["#1d4ed8", "#0f766e", "#7c3aed", "#b45309", "#be123c", "#0369a1", "#4d7c0f", "#9333ea"],
} as const;

export type Marca = typeof MARCA;
