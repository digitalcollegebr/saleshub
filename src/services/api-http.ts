/**
 * Adaptador HTTP — o único caminho de dados do navegador.
 *
 * Aponta para `/api/dados`, a rota do próprio Next que guarda o token e decide
 * entre a API real e a demonstração. Os caminhos abaixo espelham 1:1 os endpoints
 * de `/saleshub/*` no coletor (`app/saleshub/router.py`).
 */

import type { SalesHubApi } from "./contrato";
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
  Permissao,
  UsuarioAutenticado,
  UsuarioDoPainel,
} from "@/types";
import { pedir } from "./http";

function comoBusca(filtros: FiltrosDoPainel): Record<string, string | undefined> {
  return {
    periodo_inicio: filtros.periodoInicio,
    periodo_fim: filtros.periodoFim,
    unidade_id: filtros.unidadeId,
    equipe_id: filtros.equipeId,
    atendente_id: filtros.atendenteId,
    campanha_id: filtros.campanhaId,
    canal: filtros.canal,
    curso_id: filtros.cursoId,
    etapa: filtros.etapaDoFunil,
    departamento: filtros.departamento,
  };
}

export class ApiHttp implements SalesHubApi {
  constructor(private readonly baseUrl: string) {}

  obterUsuarioAtual(): Promise<UsuarioAutenticado> {
    return pedir(this.baseUrl, "/usuarios/eu");
  }

  listarUsuarios(): Promise<{ itens: readonly UsuarioDoPainel[] }> {
    return pedir(this.baseUrl, "/usuarios");
  }

  definirPermissoes(email: string, permissoes: readonly Permissao[]): Promise<UsuarioDoPainel> {
    return pedir(this.baseUrl, `/usuarios/${encodeURIComponent(email)}/permissoes`, {
      metodo: "PUT",
      corpo: { permissoes },
    });
  }

  obterOpcoesDeFiltro(): Promise<OpcoesDeFiltro> {
    return pedir(this.baseUrl, "/filtros");
  }

  obterEtapasDoFunil(): Promise<readonly EtapaDoFunil[]> {
    return pedir(this.baseUrl, "/funil/etapas");
  }

  obterPainelDoFunil(filtros: FiltrosDoPainel): Promise<PainelDoFunil> {
    return pedir(this.baseUrl, "/painel/funil", { busca: comoBusca(filtros) });
  }

  listarConversas(
    filtros: FiltrosDoPainel,
    paginacao: Paginacao,
  ): Promise<Pagina<ConversaResumida>> {
    return pedir(this.baseUrl, "/conversas", {
      busca: {
        ...comoBusca(filtros),
        pagina: String(paginacao.pagina),
        por_pagina: String(paginacao.porPagina),
      },
    });
  }

  listarConversasComAtencao(filtros: FiltrosDoPainel): Promise<readonly ConversaComAtencao[]> {
    return pedir(this.baseUrl, "/conversas/atencao", { busca: comoBusca(filtros) });
  }

  listarOportunidadesEmAberto(filtros: FiltrosDoPainel): Promise<readonly OportunidadeEmAberto[]> {
    return pedir(this.baseUrl, "/conversas/oportunidades", { busca: comoBusca(filtros) });
  }

  obterConversa(id: string): Promise<ConversaDetalhada> {
    return pedir(this.baseUrl, `/conversas/${encodeURIComponent(id)}`);
  }
}
