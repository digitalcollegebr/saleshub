/**
 * O contrato que a aplicação enxerga.
 *
 * Nenhum componente conhece `fetch`, URL ou formato de resposta: todos falam com
 * esta interface. Hoje ela é satisfeita por um adaptador de mocks; amanhã, por um
 * cliente HTTP. A troca é uma variável de ambiente, não uma refatoração — e é o
 * que permite construir a interface inteira antes de a API existir.
 */

import type {
  ConversaComAtencao,
  ConversaDetalhada,
  ConversaResumida,
  EtapaDoFunil,
  FiltrosDoPainel,
  OpcoesDeFiltro,
  OportunidadeEmAberto,
  Pagina,
  Paginacao,
  PainelDoFunil,
  UsuarioAutenticado,
} from "@/types";

export interface SalesHubApi {
  /** Usuário da sessão. Enquanto não há login, devolve um perfil de demonstração. */
  obterUsuarioAtual(): Promise<UsuarioAutenticado>;

  /** Opções dos filtros — vêm da API porque mudam com a operação, não com o build. */
  obterOpcoesDeFiltro(): Promise<OpcoesDeFiltro>;

  /**
   * Etapas do funil conversacional. Configuráveis de propósito: a taxonomia de
   * classificação vai evoluir, e isso não pode exigir deploy do frontend.
   */
  obterEtapasDoFunil(): Promise<readonly EtapaDoFunil[]>;

  /** Tudo do dashboard numa chamada — o painel é uma unidade de leitura. */
  obterPainelDoFunil(filtros: FiltrosDoPainel): Promise<PainelDoFunil>;

  listarConversas(
    filtros: FiltrosDoPainel,
    paginacao: Paginacao,
  ): Promise<Pagina<ConversaResumida>>;

  /** Conversas que pedem ação humana agora. */
  listarConversasComAtencao(filtros: FiltrosDoPainel): Promise<readonly ConversaComAtencao[]>;

  /** Próximos passos acordados e ainda em aberto. */
  listarOportunidadesEmAberto(filtros: FiltrosDoPainel): Promise<readonly OportunidadeEmAberto[]>;

  /** Conversa completa, com transcrição e evidências de cada classificação. */
  obterConversa(id: string): Promise<ConversaDetalhada>;
}
