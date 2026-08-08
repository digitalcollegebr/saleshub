/** Encerra a sessão. POST porque sair é efeito colateral — link não deve deslogar. */

import { NextResponse } from "next/server";
import { COOKIE_DA_SESSAO } from "@/lib/sessao";
import { urlDoApp } from "@/lib/url";

export const dynamic = "force-dynamic";

export function POST(pedido: Request) {
  const resposta = NextResponse.redirect(urlDoApp("/entrar", pedido), { status: 303 });
  resposta.cookies.delete(COOKIE_DA_SESSAO);
  return resposta;
}
