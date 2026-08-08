import "server-only";

/**
 * A sessão: um cookie assinado, sem estado no servidor.
 *
 * **Por que não uma biblioteca.** O que este produto precisa de autenticação cabe
 * em duas funções: assinar um objeto pequeno e conferir a assinatura. Uma
 * biblioteca de sessão traz estratégias, adaptadores e um modelo de banco que
 * ninguém aqui vai usar — e traz superfície para auditar que não é nossa. O que
 * está abaixo é HMAC-SHA256 da biblioteca padrão do Node, e cabe numa revisão.
 *
 * **O cookie carrega identidade, não permissão.** Quem pode o quê é lido do
 * coletor a cada pedido. Se a permissão viajasse assinada aqui, conceder acesso a
 * alguém só valeria no próximo login — o administrador marcaria a caixa e a
 * pessoa continuaria sem ver nada por até 12 horas, sem entender por quê. Pior:
 * revogar não teria efeito nenhum até o cookie expirar.
 *
 * **Por que sem estado.** Não há sessão em banco: o cookie carrega quem é a
 * pessoa e até quando vale, e a assinatura garante que ninguém editou. O preço é
 * não conseguir revogar uma sessão específica antes de ela expirar — para
 * revogar todas, troque `SESSAO_SEGREDO` e todo cookie emitido morre junto. Com
 * uma equipe pequena e sessão curta, é a troca certa; se um dia for preciso
 * "desconectar o Fulano agora", aí sim entra estado.
 *
 * O cookie é `HttpOnly` — JavaScript da página não o alcança, então XSS não
 * rouba sessão — `Secure`, e `SameSite=Lax`, que deixa o retorno do Google
 * funcionar (navegação de topo) e barra POST de outro site.
 */

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const COOKIE_DA_SESSAO = "saleshub_sessao";

/** 12 horas. Um turno de trabalho — quem volta no dia seguinte entra de novo. */
const DURACAO_PADRAO_SEGUNDOS = 12 * 60 * 60;

export interface Sessao {
  sub: string;
  email: string;
  nome: string;
  /** Epoch em segundos. */
  exp: number;
  /** Como a pessoa entrou. Aparece na interface: "entrou pelo Google". */
  via: "google" | "local";
}

/** Há segredo configurado? A tela de entrada usa isto para explicar o que falta. */
export function sessaoConfigurada(): boolean {
  return (process.env.SESSAO_SEGREDO ?? "").length >= 32;
}

function segredo(): Buffer {
  const bruto = process.env.SESSAO_SEGREDO ?? "";
  // Fail-closed: sem segredo não se emite nem se aceita sessão. Um valor padrão
  // aqui seria um segredo público, e todo mundo que lesse o repositório poderia
  // forjar um cookie de administrador.
  if (bruto.length < 32) {
    throw new Error("SESSAO_SEGREDO ausente ou curto demais (mínimo 32 caracteres)");
  }
  return Buffer.from(bruto, "utf8");
}

const b64url = (b: Buffer) => b.toString("base64url");

function assinatura(corpo: string): string {
  return b64url(createHmac("sha256", segredo()).update(corpo).digest());
}

/** Serializa e assina. O retorno vai inteiro no cookie. */
export function emitir(
  dados: Omit<Sessao, "exp">,
  duracaoSegundos = DURACAO_PADRAO_SEGUNDOS,
): { valor: string; maxAge: number } {
  const sessao: Sessao = { ...dados, exp: Math.floor(Date.now() / 1000) + duracaoSegundos };
  const corpo = b64url(Buffer.from(JSON.stringify(sessao), "utf8"));
  return { valor: `${corpo}.${assinatura(corpo)}`, maxAge: duracaoSegundos };
}

/**
 * Confere a assinatura e o prazo. Devolve `null` para qualquer defeito — cookie
 * ausente, adulterado, expirado ou de um segredo antigo.
 *
 * A comparação é `timingSafeEqual` de propósito: `===` em string vaza, pelo
 * tempo de resposta, quantos bytes iniciais da assinatura o atacante acertou, e
 * isso transforma forjar um cookie num problema tratável.
 */
export function ler(cookie: string | undefined): Sessao | null {
  if (!cookie) return null;

  const ponto = cookie.lastIndexOf(".");
  if (ponto <= 0) return null;

  const corpo = cookie.slice(0, ponto);
  const recebida = Buffer.from(cookie.slice(ponto + 1));

  let esperada: Buffer;
  try {
    esperada = Buffer.from(assinatura(corpo));
  } catch {
    return null; // segredo ausente — ver `segredo()`
  }
  if (recebida.length !== esperada.length || !timingSafeEqual(recebida, esperada)) return null;

  try {
    const sessao = JSON.parse(Buffer.from(corpo, "base64url").toString("utf8")) as Sessao;
    if (typeof sessao.exp !== "number" || sessao.exp * 1000 < Date.now()) return null;
    if (!sessao.email) return null;
    return sessao;
  } catch {
    return null;
  }
}

/** Valor aleatório para `state`, `nonce` e verificador PKCE. */
export function aleatorio(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/** Atributos do cookie de sessão, num lugar só para os três lugares que o gravam. */
export function atributosDoCookie(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}
