/**
 * A única porta de dados do SalesHub — e o único lugar que conhece o token.
 *
 * ## Por que isto existe
 *
 * O SalesHub roda no navegador. Qualquer segredo que entre no bundle é público:
 * `NEXT_PUBLIC_*` é substituído literalmente no JavaScript que vai para o cliente,
 * e um token de API ali é lido em dez segundos no devtools — por qualquer visitante,
 * dando acesso direto às conversas de clientes reais.
 *
 * A saída é esta rota. Ela roda **no servidor** do Next, guarda `SALESHUB_TOKEN`
 * (sem o prefixo `NEXT_PUBLIC_`, portanto nunca empacotado) e repassa a chamada. O
 * navegador fala com a própria origem; o token nunca sai daqui.
 *
 *     navegador ──▶ /api/dados/painel/funil ──▶ https://coletor…/saleshub/painel/funil
 *                   (mesma origem)                (Authorization: Bearer …)
 *
 * Isto **não** transforma o projeto em backend: não há coleta, banco nem regra de
 * negócio aqui. É um encaminhador de leitura, que existe só porque um app de
 * navegador não tem onde guardar segredo.
 *
 * ## Demonstração e dados reais atendem pela mesma porta
 *
 * Sem `API_URL`/`SALESHUB_TOKEN`, esta rota responde com o adaptador de
 * demonstração — o mesmo `ApiMock`, agora executado aqui em vez de no navegador.
 * Com as duas preenchidas, encaminha para o coletor.
 *
 * O ganho é que **o bundle é idêntico nos dois modos**: ligar os dados reais deixa
 * de ser rebuild de imagem e passa a ser preencher dois campos e reiniciar. E some
 * a possibilidade de um interruptor (`NEXT_PUBLIC_USAR_MOCKS`) ficar em desacordo
 * com a configuração que ele deveria refletir.
 *
 * ## O que falta antes de ligar em produção
 *
 * `autorizado()` é o gargalo por onde a autenticação entra, e ele vale **só para o
 * modo real**: dado de demonstração não é de ninguém, e exigir sessão para vê-lo
 * deixaria o painel em branco sem proteger nada. Enquanto não há login, o padrão
 * para dados reais é RECUSAR — `PERMITIR_SEM_SESSAO=true` existe para desenvolvimento.
 */

import { NextRequest } from "next/server";

import { ApiMock } from "@/services/mock/api-mock";
import { configuracaoDoColetor } from "@/services/origem";
import type { FiltrosDoPainel, Paginacao } from "@/types";

/** Nunca cachear: o painel é leitura de dado operacional, muda o tempo todo. */
export const dynamic = "force-dynamic";

const TEMPO_LIMITE_MS = 25_000;

/**
 * Uma instância só, no escopo do módulo: o gerador de demonstração produz 560
 * conversas de forma determinística, e recriá-lo a cada requisição transformaria
 * cada abertura de tela em trabalho desperdiçado.
 */
const demonstracao = new ApiMock();

/**
 * Rotas permitidas — lista fechada, não prefixo aberto. Cada uma sabe também como
 * ser respondida em modo demonstração, o que mantém as duas metades desta porta
 * em sincronia: acrescentar rota sem dizer como demonstrá-la não compila.
 */
const ROTAS = [
  {
    padrao: /^filtros$/,
    demo: () => demonstracao.obterOpcoesDeFiltro(),
  },
  {
    padrao: /^funil\/etapas$/,
    demo: () => demonstracao.obterEtapasDoFunil(),
  },
  {
    padrao: /^painel\/funil$/,
    demo: (f: FiltrosDoPainel) => demonstracao.obterPainelDoFunil(f),
  },
  {
    padrao: /^conversas$/,
    demo: (f: FiltrosDoPainel, p: Paginacao) => demonstracao.listarConversas(f, p),
  },
  {
    padrao: /^conversas\/atencao$/,
    demo: (f: FiltrosDoPainel) => demonstracao.listarConversasComAtencao(f),
  },
  {
    padrao: /^conversas\/oportunidades$/,
    demo: (f: FiltrosDoPainel) => demonstracao.listarOportunidadesEmAberto(f),
  },
  {
    padrao: /^conversas\/[^/]+$/,
    demo: (_f: FiltrosDoPainel, _p: Paginacao, id: string) => demonstracao.obterConversa(id),
  },
] as const;

function autorizado(): boolean {
  // TODO(autenticação): trocar por verificação de sessão de verdade — é aqui que
  // o provedor de identidade encosta. Enquanto não existe, o padrão é NEGAR: um
  // proxy aberto para conversas de clientes é pior que não ter proxy nenhum.
  return process.env.PERMITIR_SEM_SESSAO === "true";
}

/**
 * Reconstrói os filtros a partir da query string.
 *
 * O adaptador de demonstração recebe `FiltrosDoPainel` (camelCase); a query chega
 * no formato que a API real entende (snake_case), montada em `api-http.ts`. Traduzir
 * aqui é o preço de o navegador falar uma língua só — e é um lugar só.
 */
function filtrosDaBusca(busca: URLSearchParams): FiltrosDoPainel {
  const fim = busca.get("periodo_fim") ?? new Date().toISOString();
  const inicio = busca.get("periodo_inicio") ?? new Date(Date.now() - 30 * 86400000).toISOString();
  return {
    periodoInicio: inicio,
    periodoFim: fim,
    unidadeId: busca.get("unidade_id") ?? undefined,
    equipeId: busca.get("equipe_id") ?? undefined,
    atendenteId: busca.get("atendente_id") ?? undefined,
    campanhaId: busca.get("campanha_id") ?? undefined,
    canal: busca.get("canal") ?? undefined,
    cursoId: busca.get("curso_id") ?? undefined,
    etapaDoFunil: busca.get("etapa") ?? undefined,
    departamento: busca.get("departamento") ?? undefined,
  };
}

function paginacaoDaBusca(busca: URLSearchParams): Paginacao {
  return {
    pagina: Number(busca.get("pagina") ?? 1) || 1,
    porPagina: Number(busca.get("por_pagina") ?? 25) || 25,
  };
}

export async function GET(
  req: NextRequest,
  contexto: { params: Promise<{ caminho: string[] }> },
): Promise<Response> {
  const { caminho } = await contexto.params;
  const rota = caminho.join("/");

  const permitida = ROTAS.find(({ padrao }) => padrao.test(rota));
  if (!permitida) {
    return Response.json({ erro: "Rota não permitida." }, { status: 404 });
  }

  const { modo, base, token } = configuracaoDoColetor();

  if (modo === "mock") {
    const busca = req.nextUrl.searchParams;
    const dados = await permitida.demo(
      filtrosDaBusca(busca),
      paginacaoDaBusca(busca),
      rota.replace("conversas/", ""),
    );
    // Cabeçalho para quem estiver depurando ver de onde veio sem abrir a tela.
    return Response.json(dados, { headers: { "x-origem-dos-dados": "mock" } });
  }

  if (!autorizado()) {
    return Response.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const destino = new URL(rota, base.endsWith("/") ? base : `${base}/`);
  // A query string passa inteira: os filtros do painel vivem nela.
  destino.search = req.nextUrl.search;

  const controle = new AbortController();
  const limite = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);
  try {
    const resposta = await fetch(destino, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      signal: controle.signal,
      cache: "no-store",
    });

    // O corpo é repassado como veio; o status também. O que NÃO é repassado são os
    // cabeçalhos da origem — evita vazar detalhe de infraestrutura para o navegador.
    const corpo = await resposta.text();
    return new Response(corpo, {
      status: resposta.status,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "x-origem-dos-dados": "api",
      },
    });
  } catch {
    return Response.json({ erro: "A API de analytics não respondeu." }, { status: 504 });
  } finally {
    clearTimeout(limite);
  }
}
