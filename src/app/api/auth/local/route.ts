/**
 * Entrada do usuário local — a saída de emergência.
 *
 * Existe para o dia em que o Google Workspace estiver fora do ar, a conta
 * estiver bloqueada, ou a rede não alcançar `accounts.google.com`. Sem ela, uma
 * indisponibilidade do provedor de identidade vira indisponibilidade do painel.
 *
 * É **uma** conta, com senha guardada como hash scrypt. Nunca substitui o
 * Google no uso diário: quem tem conta do domínio entra por lá, e é lá que a
 * organização revoga acesso quando alguém sai.
 */

import { NextResponse } from "next/server";
import { scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { adminLocalConfigurado } from "@/lib/acesso";
import { COOKIE_DA_SESSAO, atributosDoCookie, emitir } from "@/lib/sessao";
import { urlDoApp } from "@/lib/url";

export const dynamic = "force-dynamic";

const derivar = promisify(scrypt) as (
  senha: string,
  sal: string,
  tamanho: number,
) => Promise<Buffer>;

/**
 * Confere a senha contra `sal:hash` em hex.
 *
 * `timingSafeEqual` pelo mesmo motivo da assinatura da sessão: comparação que
 * para no primeiro byte diferente vaza, pelo tempo, o quanto o palpite acertou.
 */
async function senhaConfere(senha: string): Promise<boolean> {
  const [sal, esperado] = (process.env.ADMIN_SENHA_HASH ?? "").split(":");
  if (!sal || !esperado) return false;
  try {
    const alvo = Buffer.from(esperado, "hex");
    const obtido = await derivar(senha, sal, alvo.length);
    return alvo.length === obtido.length && timingSafeEqual(alvo, obtido);
  } catch {
    return false;
  }
}

export async function POST(pedido: Request) {
  const recusa = () =>
    NextResponse.redirect(urlDoApp("/entrar?erro=credenciais", pedido), { status: 303 });

  if (!adminLocalConfigurado()) return recusa();

  const formulario = await pedido.formData();
  const email = String(formulario.get("email") ?? "")
    .trim()
    .toLowerCase();
  const senha = String(formulario.get("senha") ?? "");

  // Confere a senha mesmo com e-mail errado: sair antes tornaria o tempo de
  // resposta um oráculo de "este e-mail existe".
  const senhaOk = await senhaConfere(senha);
  const emailOk = email === (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  if (!emailOk || !senhaOk) return recusa();

  const { valor, maxAge } = emitir({
    sub: "local",
    email,
    nome: "Administrador local",
    via: "local",
  });

  const resposta = NextResponse.redirect(urlDoApp("/funil", pedido), { status: 303 });
  resposta.cookies.set(COOKIE_DA_SESSAO, valor, atributosDoCookie(maxAge));
  return resposta;
}
