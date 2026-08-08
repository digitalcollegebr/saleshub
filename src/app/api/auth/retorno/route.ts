/**
 * Retorno do Google.
 *
 * Confere `state` contra o cookie, troca o código pelo ID token e só então
 * decide o perfil. Qualquer falha volta para `/entrar` com um motivo genérico:
 * a tela não precisa saber se foi o domínio, o nonce ou o código, e dizer isso
 * só ajudaria quem está tentando.
 */

import { NextResponse } from "next/server";
import { identidadeDoCodigo, urlDeRetorno } from "@/lib/google";
import { perfilDe } from "@/lib/acesso";
import { COOKIE_DA_SESSAO, atributosDoCookie, emitir } from "@/lib/sessao";

export const dynamic = "force-dynamic";

function recusar(pedido: Request, motivo: string) {
  const resposta = NextResponse.redirect(new URL(`/entrar?erro=${motivo}`, pedido.url));
  for (const c of ["saleshub_state", "saleshub_nonce", "saleshub_pkce", "saleshub_destino"]) {
    resposta.cookies.delete(c);
  }
  return resposta;
}

export async function GET(pedido: Request) {
  const url = new URL(pedido.url);
  const codigo = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  // O Next entrega cookies do pedido pelo header; ler direto evita depender de
  // `cookies()` numa rota que também precisa escrever.
  const enviados = new Map(
    (pedido.headers.get("cookie") ?? "")
      .split(";")
      .map((p) => p.trim().split("="))
      .filter((p) => p.length === 2)
      .map(([k, v]) => [k, decodeURIComponent(v)]),
  );

  if (!codigo || !state || state !== enviados.get("saleshub_state")) {
    return recusar(pedido, "pedido_invalido");
  }

  const identidade = await identidadeDoCodigo({
    codigo,
    retorno: urlDeRetorno(pedido),
    verificador: enviados.get("saleshub_pkce") ?? "",
    nonce: enviados.get("saleshub_nonce") ?? "",
  });
  if (!identidade) return recusar(pedido, "pedido_invalido");

  // Autenticado no Google não é autorizado aqui: o perfil vem de ACESSOS, e sem
  // perfil não há entrada. Ver a decisão em lib/acesso.ts.
  const perfil = perfilDe(identidade.email);
  if (!perfil) return recusar(pedido, "sem_acesso");

  const { valor, maxAge } = emitir({
    sub: identidade.sub,
    email: identidade.email,
    nome: identidade.nome,
    perfil,
    via: "google",
  });

  const guardado = enviados.get("saleshub_destino") ?? "";
  const destino = new URL(
    guardado.startsWith("/") && !guardado.startsWith("//") ? guardado : "/funil",
    pedido.url,
  );
  const resposta = NextResponse.redirect(destino);
  resposta.cookies.set(COOKIE_DA_SESSAO, valor, atributosDoCookie(maxAge));
  for (const c of ["saleshub_state", "saleshub_nonce", "saleshub_pkce"]) {
    resposta.cookies.delete(c);
  }
  return resposta;
}
