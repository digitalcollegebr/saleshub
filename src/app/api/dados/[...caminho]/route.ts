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
import { cookies } from "next/headers";
import { COOKIE_DA_SESSAO, ler } from "@/lib/sessao";
import { permissoesDe } from "@/lib/permissoes-do-usuario";
import type { Permissao } from "@/types";
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
  // Administração de acesso. `somenteAdmin` é o que impede alguém com permissão
  // de cobrança de se promover a administrador chamando a API na mão — esconder
  // o item do menu não protege nada.
  {
    padrao: /^usuarios$/,
    somenteAdmin: true,
    demo: () => demonstracao.listarUsuarios(),
  },
  {
    padrao: /^usuarios\/[^/]+\/permissoes$/,
    somenteAdmin: true,
    demo: () => demonstracao.listarUsuarios(),
  },
  {
    padrao: /^conversas\/[^/]+$/,
    demo: (_f: FiltrosDoPainel, _p: Paginacao, id: string) => demonstracao.obterConversa(id),
  },
] as const;

/**
 * Sessão válida? `src/proxy.ts` já barra antes de chegar aqui — isto é a segunda
 * tranca, e existe porque um proxy é uma linha de `matcher` de distância de
 * deixar uma rota passar. Um proxy de dados aberto para conversas de clientes é
 * pior que não ter proxy nenhum.
 *
 * `PERMITIR_SEM_SESSAO` continua, restrito ao desenvolvimento: em produção ele é
 * ignorado, para que ninguém abra o painel inteiro esquecendo uma variável.
 */
async function autorizado(): Promise<boolean> {
  if (ler((await cookies()).get(COOKIE_DA_SESSAO)?.value)) return true;
  return process.env.NODE_ENV !== "production" && process.env.PERMITIR_SEM_SESSAO === "true";
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

/**
 * A pessoa da sessão é administradora?
 *
 * Consultado no coletor com o mesmo cache curto de `/usuarios/eu` — não pode
 * viajar no cookie, senão promover alguém a administrador só valeria no próximo
 * login e rebaixar não valeria até o cookie expirar.
 */
async function permissoesDaSessao(): Promise<Permissao[] | null> {
  const sessao = ler((await cookies()).get(COOKIE_DA_SESSAO)?.value);
  if (!sessao) return null;
  if (sessao.via === "local") return ["administrador"];
  return permissoesDe(sessao.email, sessao.nome);
}

/** A sessão alcança esta rota, com este recorte? */
async function podeBuscar(rota: string, busca: URLSearchParams): Promise<boolean> {
  const minhas = await permissoesDaSessao();
  if (!minhas) return process.env.NODE_ENV !== "production";
  if (minhas.includes("administrador")) return true;
  return permissoesQuePermitem(rota, busca).some((p) => minhas.includes(p));
}

async function ehAdministrador(): Promise<boolean> {
  return (await permissoesDaSessao())?.includes("administrador") ?? false;
}

/**
 * O buraco do quiosque: o que a TV da sala lê sem sessão.
 *
 * A TV fica ligada meses numa parede. Sessão federada expira, e o que aparece na
 * reunião é a tela de login — daí `/tv` passar sem cookie (ver `ABERTAS` em
 * `proxy.ts`). Só que a página busca dados, então a liberação precisa alcançar a
 * rota que ela consome, e **apenas** ela.
 *
 * **O que isto torna público, para quem souber a URL:** os agregados das três
 * áreas — volume, primeira resposta, qualidade, sentimento, etapas do funil,
 * objeções, cursos — e o `ranking`, que traz nome e desempenho por atendente.
 * Não é só número. O que continua fechado é `/conversas`: nome, telefone e
 * conteúdo de cliente exigem sessão e permissão como antes.
 *
 * Lista fechada, e por isso `departamento` também é conferido: `painel/funil` é
 * a mesma rota para as três áreas, e `nao_identificado` — que exige
 * administrador no caminho autenticado — fica de fora justamente por não ser um
 * dos três rodízios da TV. Deixar o parâmetro livre abriria pelo quiosque um
 * recorte que a permissão nega.
 */
const QUIOSQUE = {
  rota: "painel/funil",
  departamentos: new Set(["", "cobranca", "atendimento_ao_aluno"]),
} as const;

function ehPedidoDoQuiosque(rota: string, busca: URLSearchParams, metodo: string): boolean {
  if (metodo !== "GET") return false;
  if (rota !== QUIOSQUE.rota) return false;
  return QUIOSQUE.departamentos.has(busca.get("departamento") ?? "");
}

/**
 * Qual permissão a rota exige — basta ter UMA da lista.
 *
 * Esconder o item do menu e recusar a página não protegem o dado: um `curl` com
 * o cookie da sessão continuava trazendo o painel inteiro para quem não tinha
 * permissão nenhuma. Encontrado testando exatamente isso.
 *
 * `painel/funil` depende do recorte pedido, porque é a mesma rota que serve as
 * três áreas: quem só tem cobrança pode pedir o painel de cobrança e mais nada.
 * Sem departamento é o painel comercial.
 */
function permissoesQuePermitem(rota: string, busca: URLSearchParams): readonly Permissao[] {
  if (rota === "painel/funil") {
    const departamento = busca.get("departamento");
    if (departamento === "cobranca") return ["cobranca"];
    if (departamento === "atendimento_ao_aluno") return ["atendimento"];
    if (departamento === "nao_identificado") return ["administrador"];
    return ["comercial"];
  }
  // Listas, filtros e etapas atravessam departamento por natureza — qualquer
  // permissão operacional abre. É o mesmo limite anotado em `types/usuario.ts`:
  // quem só tem cobrança enxerga conversa comercial na lista, e separar isso
  // exige filtrar a lista pela permissão.
  return ["comercial", "cobranca", "atendimento"];
}

async function encaminhar(
  req: NextRequest,
  caminho: string[],
  metodo: "GET" | "PUT",
): Promise<Response> {
  const rota = caminho.join("/");

  const permitida = ROTAS.find(({ padrao }) => padrao.test(rota));
  if (!permitida) {
    return Response.json({ erro: "Rota não permitida." }, { status: 404 });
  }

  // Antes de qualquer coisa, inclusive do modo demonstração: administração de
  // acesso não é dado de painel, e não deve ficar aberta nem com dado fictício.
  const doQuiosque = ehPedidoDoQuiosque(rota, req.nextUrl.searchParams, metodo);

  if ("somenteAdmin" in permitida && permitida.somenteAdmin) {
    if (!(await ehAdministrador())) {
      return Response.json({ erro: "Requer permissão de administrador." }, { status: 403 });
    }
  } else if (!doQuiosque && !(await podeBuscar(rota, req.nextUrl.searchParams))) {
    return Response.json({ erro: "Sem permissão para estes dados." }, { status: 403 });
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

  if (!doQuiosque && !(await autorizado())) {
    return Response.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const destino = new URL(rota, base.endsWith("/") ? base : `${base}/`);
  // A query string passa inteira: os filtros do painel vivem nela.
  destino.search = req.nextUrl.search;

  const corpoEnviado = metodo === "PUT" ? await req.text() : undefined;

  const controle = new AbortController();
  const limite = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);
  try {
    const resposta = await fetch(destino, {
      method: metodo,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(corpoEnviado === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: corpoEnviado,
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

export async function GET(
  req: NextRequest,
  contexto: { params: Promise<{ caminho: string[] }> },
): Promise<Response> {
  return encaminhar(req, (await contexto.params).caminho, "GET");
}

/** Só a atribuição de permissões escreve. Nenhuma outra rota aceita PUT. */
export async function PUT(
  req: NextRequest,
  contexto: { params: Promise<{ caminho: string[] }> },
): Promise<Response> {
  return encaminhar(req, (await contexto.params).caminho, "PUT");
}
