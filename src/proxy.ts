/**
 * A tranca da porta.
 *
 * Roda antes de qualquer rota — página ou API — e é o único lugar que decide se
 * o pedido segue. Ter um só ponto é a diferença entre "protegido" e "protegido
 * onde alguém lembrou": a rota nova de amanhã nasce fechada.
 *
 * No Next 16 este arquivo se chama `proxy.ts`; `middleware.ts` foi descontinuado
 * e renomeado (o nome antigo ainda funciona, mas avisa). Ele roda no runtime do
 * Node, o que permite usar `node:crypto` para conferir a assinatura da sessão —
 * no Edge isso exigiria outra implementação.
 *
 * **Página recusada redireciona; API recusada responde 401.** Devolver HTML de
 * login para um `fetch` faria o React Query tentar interpretar a tela de login
 * como dado, e o erro apareceria como "formato inesperado" em vez de "sua sessão
 * caiu".
 */

import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_DA_SESSAO, ler } from "@/lib/sessao";
import { urlDoApp } from "@/lib/url";

/**
 * O que passa sem sessão.
 *
 * Lista curta e fechada, por prefixo exato. `/api/saude` fica aberta porque é o
 * healthcheck do container — se ela exigisse sessão, o Docker mataria o serviço
 * por não conseguir provar que ele está vivo.
 */
const ABERTAS = ["/entrar", "/api/auth/", "/api/saude"];

export function proxy(pedido: NextRequest) {
  const { pathname } = pedido.nextUrl;

  if (ABERTAS.some((prefixo) => pathname === prefixo || pathname.startsWith(prefixo))) {
    return NextResponse.next();
  }

  if (ler(pedido.cookies.get(COOKIE_DA_SESSAO)?.value)) {
    return NextResponse.next();
  }

  // Desenvolvimento sem provedor de identidade. Restrito a `NODE_ENV !==
  // production` no código, e não só à variável: uma variável esquecida no
  // Coolify abriria o painel inteiro, e essa é a falha que não se percebe
  // olhando a tela — ela fica igualzinha.
  if (process.env.NODE_ENV !== "production" && process.env.PERMITIR_SEM_SESSAO === "true") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ erro: "Sessão expirada ou ausente." }, { status: 401 });
  }

  // `destino` para voltar ao lugar certo depois do login: quem recebeu um link
  // do painel de cobrança não quer cair no funil.
  const login = urlDoApp("/entrar", pedido);
  if (pathname !== "/") login.searchParams.set("destino", pathname + pedido.nextUrl.search);
  return NextResponse.redirect(login);
}

export const config = {
  /**
   * Tudo, menos o que o navegador busca sozinho para montar a página.
   *
   * Sem esta exclusão o CSS e o JS também seriam redirecionados para `/entrar`,
   * e a tela de login apareceria sem estilo — o aviso do próprio doc do Next.
   */
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
