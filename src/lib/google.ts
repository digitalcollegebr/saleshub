import "server-only";

/**
 * Entrada pelo Google Workspace — OpenID Connect, Authorization Code + PKCE.
 *
 * Três proteções, e vale saber contra o quê cada uma serve:
 *
 * * **`state`** — o retorno tem que casar com um pedido que este navegador fez.
 *   Sem ele, alguém induz a vítima a completar um login com o código do
 *   atacante, e a vítima passa a operar dentro da conta dele (login CSRF).
 * * **`nonce`** — vai no pedido e volta dentro do ID token. Amarra o token a
 *   este login, impedindo que um token válido obtido em outro lugar seja
 *   reaproveitado aqui.
 * * **PKCE** — o código de autorização só vale para quem tem o verificador.
 *   Formalmente dispensável num cliente com segredo, mas é barato e cobre o
 *   caso de o código vazar em log de proxy ou histórico.
 *
 * **Sobre não verificar a assinatura do ID token.** Ele não chega pelo
 * navegador: é buscado por este servidor no endpoint de token do Google, sobre
 * TLS. O OIDC Core §3.1.3.7 dispensa a checagem de assinatura exatamente nesse
 * caso, porque a autenticidade já vem do canal. O que continua obrigatório —
 * e está feito abaixo — é conferir `iss`, `aud`, `exp`, `nonce` e `hd`.
 */

import { DOMINIOS_PERMITIDOS, dominioPermitido } from "./acesso";
import { baseDaAplicacao } from "./url";

const AUTORIZACAO = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN = "https://oauth2.googleapis.com/token";
const EMISSORES = new Set(["https://accounts.google.com", "accounts.google.com"]);

export function googleConfigurado(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/**
 * A URL de retorno precisa bater **exatamente** com a cadastrada no console do
 * Google. Derivada do pedido para funcionar em produção e no desenvolvimento sem
 * duas variáveis que saem de sincronia — mas `URL_PUBLICA` vence quando existe,
 * porque atrás do Traefik o host que o Next enxerga pode ser o interno.
 */
export function urlDeRetorno(pedido: Request): string {
  return `${baseDaAplicacao(pedido)}/api/auth/retorno`;
}

export function urlDeAutorizacao(opcoes: {
  retorno: string;
  state: string;
  nonce: string;
  desafio: string;
}): string {
  const url = new URL(AUTORIZACAO);
  url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID!);
  url.searchParams.set("redirect_uri", opcoes.retorno);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", opcoes.state);
  url.searchParams.set("nonce", opcoes.nonce);
  url.searchParams.set("code_challenge", opcoes.desafio);
  url.searchParams.set("code_challenge_method", "S256");
  // `hd` faz o Google já mostrar só contas do domínio. É conveniência de tela,
  // NÃO segurança: o parâmetro viaja pelo navegador e pode ser trocado. Quem
  // decide é a conferência do `hd` no token, abaixo.
  //
  // O Google aceita um domínio só aqui. Com mais de um, `*` é o mais próximo
  // disso — filtra para qualquer conta Workspace, deixando as pessoais de fora.
  // Escolher um dos dois esconderia o outro na tela sem recusá-lo de fato.
  url.searchParams.set("hd", DOMINIOS_PERMITIDOS.length === 1 ? DOMINIOS_PERMITIDOS[0] : "*");
  // Sem isto, quem tem várias contas Google entra direto na última usada e não
  // entende por que o acesso foi negado.
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

export interface IdentidadeGoogle {
  sub: string;
  email: string;
  nome: string;
}

/**
 * Troca o código pelo ID token e devolve a identidade — ou `null` se qualquer
 * conferência falhar. Um único caminho de recusa, sem mensagem específica: dizer
 * "domínio errado" e "nonce inválido" separadamente ensina o atacante onde
 * insistir.
 */
export async function identidadeDoCodigo(opcoes: {
  codigo: string;
  retorno: string;
  verificador: string;
  nonce: string;
}): Promise<IdentidadeGoogle | null> {
  const resposta = await fetch(TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: opcoes.codigo,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: opcoes.retorno,
      grant_type: "authorization_code",
      code_verifier: opcoes.verificador,
    }),
    cache: "no-store",
  });
  if (!resposta.ok) return null;

  const corpo = (await resposta.json()) as { id_token?: string };
  if (!corpo.id_token) return null;

  const partes = corpo.id_token.split(".");
  if (partes.length !== 3) return null;

  let dados: Record<string, unknown>;
  try {
    dados = JSON.parse(Buffer.from(partes[1], "base64url").toString("utf8"));
  } catch {
    return null;
  }

  const agora = Math.floor(Date.now() / 1000);
  const iss = String(dados.iss ?? "");
  const aud = String(dados.aud ?? "");
  const exp = Number(dados.exp ?? 0);
  const email = String(dados.email ?? "").toLowerCase();
  const dominio = String(dados.hd ?? "").toLowerCase();

  if (!EMISSORES.has(iss)) return null;
  if (aud !== process.env.GOOGLE_CLIENT_ID) return null;
  if (!Number.isFinite(exp) || exp <= agora) return null;
  if (dados.nonce !== opcoes.nonce) return null;
  // `email_verified` importa: sem ele, uma conta poderia declarar um e-mail que
  // não controla, e o mapa de ACESSOS é indexado por e-mail.
  if (dados.email_verified !== true) return null;
  // A tranca do domínio. `hd` só existe em conta Workspace — conta pessoal
  // @gmail.com não tem o campo e cai aqui.
  //
  // As duas conferências existem porque `hd` e o e-mail podem discordar: `hd` é
  // o domínio primário do Workspace, e o endereço pode estar num domínio alias.
  // Exigir que ambos estejam na lista cobre o alias sem aceitar qualquer conta
  // de um Workspace que por acaso tenha o domínio certo como primário.
  if (!dominioPermitido(dominio)) return null;
  if (!DOMINIOS_PERMITIDOS.some((permitido) => email.endsWith(`@${permitido}`))) return null;

  return {
    sub: String(dados.sub ?? email),
    email,
    nome: String(dados.name ?? email.split("@")[0]),
  };
}
