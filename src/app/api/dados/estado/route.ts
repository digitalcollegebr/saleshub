/**
 * "Está conectado?" — a resposta em uma URL.
 *
 * Sem isto, descobrir se a ligação com o coletor funcionou significa abrir o painel
 * e interpretar o silêncio: tela vazia pode ser token errado, coletor fora do ar,
 * período sem conversa ou filtro apertado demais. Quatro causas, um sintoma.
 *
 * Esta rota separa as quatro. Ela **chama o coletor de verdade** (o endpoint mais
 * barato que existe, o de etapas do funil) e reporta o que aconteceu.
 *
 * É também o que alimenta o selo "Dados de demonstração" no topo do painel: antes
 * ele vinha de `NEXT_PUBLIC_USAR_MOCKS`, gravado no bundle em tempo de build; agora
 * vem de quem realmente sabe, que é o servidor.
 *
 * Não exige sessão de propósito: não devolve dado de conversa nenhum, e é
 * justamente a rota que alguém precisa consultar quando o resto está negando acesso.
 * O que ela nunca devolve é o token — só se ele existe.
 */

import { configuracaoDoColetor } from "@/services/origem";

export const dynamic = "force-dynamic";

const TEMPO_LIMITE_MS = 8_000;

export async function GET(): Promise<Response> {
  const { modo, base, token } = configuracaoDoColetor();
  const em = new Date().toISOString();

  if (modo === "mock") {
    return Response.json({
      modo,
      em,
      coletorConfigurado: false,
      // Qual das duas está faltando — é a pergunta seguinte de quem vê "mock" sem querer.
      faltando: [!base && "API_URL", !token && "SALESHUB_TOKEN"].filter(Boolean),
      diagnostico:
        "Servindo dados de demonstração. Defina API_URL e SALESHUB_TOKEN no servidor " +
        "para ligar o coletor.",
    });
  }

  const destino = new URL("funil/etapas", base.endsWith("/") ? base : `${base}/`);
  const controle = new AbortController();
  const limite = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);
  const comecou = Date.now();

  try {
    const resposta = await fetch(destino, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      signal: controle.signal,
      cache: "no-store",
    });

    // 404 aqui quase sempre é token errado, não rota errada: o coletor é
    // fail-closed e responde 404 (não 401) quando o token não confere, para não
    // anunciar a existência da rota a quem não deveria saber dela.
    const diagnostico = resposta.ok
      ? "Conectado ao coletor."
      : resposta.status === 404
        ? "O coletor respondeu 404: token incorreto, ou SALESHUB_TOKEN não definido no coletor."
        : `O coletor respondeu ${resposta.status}.`;

    return Response.json({
      modo,
      em,
      coletorConfigurado: true,
      coletorAlcancavel: true,
      statusDoColetor: resposta.status,
      conectado: resposta.ok,
      latenciaMs: Date.now() - comecou,
      diagnostico,
    });
  } catch {
    return Response.json({
      modo,
      em,
      coletorConfigurado: true,
      coletorAlcancavel: false,
      conectado: false,
      diagnostico: `Não foi possível alcançar ${destino.origin}. Confira API_URL e a rede.`,
    });
  } finally {
    clearTimeout(limite);
  }
}
