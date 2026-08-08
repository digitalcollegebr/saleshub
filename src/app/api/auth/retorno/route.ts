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
import { COOKIE_DA_SESSAO, atributosDoCookie, emitir } from "@/lib/sessao";
import { urlDoApp } from "@/lib/url";

export const dynamic = "force-dynamic";

function recusar(pedido: Request, motivo: string) {
  const resposta = NextResponse.redirect(urlDoApp(`/entrar?erro=${motivo}`, pedido));
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

  // Autenticado no Google entra — no domínio certo, a sessão é criada. O que
  // ele PODE ver é outra pergunta, respondida a cada pedido pelas permissões da
  // tabela `painel_usuarios`. Quem ainda não recebeu nenhuma cai na tela de
  // "peça acesso ao administrador", que é diferente de não conseguir entrar.
  const { valor, maxAge } = emitir({
    sub: identidade.sub,
    email: identidade.email,
    nome: identidade.nome,
    via: "google",
  });

  const guardado = enviados.get("saleshub_destino") ?? "";
  const destino = urlDoApp(
    guardado.startsWith("/") && !guardado.startsWith("//") ? guardado : "/funil",
    pedido,
  );
  const resposta = NextResponse.redirect(destino);
  resposta.cookies.set(COOKIE_DA_SESSAO, valor, atributosDoCookie(maxAge));
  for (const c of ["saleshub_state", "saleshub_nonce", "saleshub_pkce"]) {
    resposta.cookies.delete(c);
  }
  return resposta;
}
