/**
 * Identidade visual, num arquivo só.
 *
 * Os valores vêm do site da Digital College (digitalcollege.com.br), lidos do CSS
 * em produção e não estimados de captura de tela:
 *
 *   magenta de ação   #C61066   (botão "Quero saber mais")
 *   tipografia        Montserrat 300–800
 *   raio de card      20px      ·  botão vira pílula (50px)
 *   superfícies       preto, com cartão levemente acima do fundo
 *
 * A marca é um `>_` — prompt de terminal — num quadrado magenta de cantos
 * arredondados. É o mesmo desenho que se repete na arte de fundo da instituição,
 * e é de onde vem o padrão de chevrons em `<FundoDaMarca>`.
 *
 * Nenhum componente escreve cor literal: estes tokens viram variáveis CSS em
 * `globals.css`. Trocar a identidade é editar este arquivo e aquelas linhas.
 */

export const MARCA = {
  produto: "SalesHub",
  descricao: "Conversation Analytics comercial",
  organizacao: "Digital College",
  assinatura: "Análises construídas sobre as conversas atendidas no SZ Chat",

  cores: {
    /** Magenta institucional. Ação e destaque — nunca decoração. */
    primaria: "#c61066",
    /** Um passo acima, para hover: é o tom que o site usa no estado ativo. */
    primariaClara: "#e0177a",
    primariaEscura: "#aa1d5f",
    /** Fundo tênue para área selecionada. Magenta a 12% sobre o preto. */
    primariaSuave: "#2a0c1c",
    /**
     * Acento de apoio. Ciano-esverdeado porque é o complementar do magenta: numa
     * série de duas cores, elas se separam mesmo para quem tem deuteranopia — o
     * que azul e roxo, do esquema anterior, não garantiam.
     */
    acento: "#0fb5a5",
  },

  /**
   * Semântica de dado — separada da cor de marca de propósito. Estas cores
   * comunicam *natureza da informação*, e confundi-las com a identidade faria a
   * interface parecer decorada quando ela está, na verdade, sinalizando.
   *
   * Ajustadas para fundo escuro: os tons do esquema claro (#0f766e, #a16207)
   * ficavam abaixo de 4.5:1 sobre preto.
   */
  semantica: {
    explicito: "#2dd4bf",
    inferido: "#fbbf24",
    naoIdentificado: "#94a3b8",
    requerConfirmacao: "#fb923c",
    atencao: "#f87171",
  },

  /**
   * Paleta ordenada para gráficos categóricos.
   *
   * Começa no magenta da marca e segue o mesmo espírito das barras coloridas dos
   * cards de formação do site — laranja, verde, âmbar, azul. Ordenada por
   * distância de matiz, não por gosto: séries vizinhas num gráfico precisam se
   * separar, e é a primeira cor que carrega a marca.
   */
  serie: ["#c61066", "#0fb5a5", "#f6913f", "#7cc98a", "#8b7cf6", "#5b9bd5", "#e8574c", "#f2c744"],
} as const;

export type Marca = typeof MARCA;
