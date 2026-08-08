/**
 * Início do login pelo Google.
 *
 * `state`, `nonce` e o verificador PKCE ficam em cookies curtos e `HttpOnly`
 * até o retorno. Poderiam ir para uma sessão de servidor, mas isso exigiria
 * estado antes mesmo de haver usuário — cookie de dez minutos resolve o mesmo
 * problema e desaparece sozinho.
 */

import { NextResponse } from "next/server";
import { googleConfigurado, urlDeAutorizacao, urlDeRetorno } from "@/lib/google";
import { aleatorio } from "@/lib/sessao";
import { createHash } from "node:crypto";

export const dynamic = "force-dynamic";

/** Dez minutos: tempo de digitar a senha no Google, não mais. */
const VALIDADE = 600;

export async function GET(pedido: Request) {
  if (!(await googleConfigurado())) {
    return NextResponse.redirect(new URL("/entrar?erro=google_indisponivel", pedido.url));
  }

  const destino = new URL(pedido.url).searchParams.get("destino") ?? "";
  const state = aleatorio();
  const nonce = aleatorio();
  const verificador = aleatorio();
  const desafio = createHash("sha256").update(verificador).digest("base64url");
  const retorno = await urlDeRetorno(pedido);

  const resposta = NextResponse.redirect(
    await urlDeAutorizacao({ retorno, state, nonce, desafio }),
  );
  const atributos = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: VALIDADE,
  };
  resposta.cookies.set("saleshub_state", state, atributos);
  resposta.cookies.set("saleshub_nonce", nonce, atributos);
  resposta.cookies.set("saleshub_pkce", verificador, atributos);
  // Só caminho interno: guardar a URL crua deixaria alguém montar um link que
  // devolve a vítima autenticada para um site de fora (open redirect).
  if (destino.startsWith("/") && !destino.startsWith("//")) {
    resposta.cookies.set("saleshub_destino", destino, atributos);
  }
  return resposta;
}
