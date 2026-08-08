/**
 * Quem é o usuário da sessão.
 *
 * Rota **local**, não encaminhada: quem sabe quem está logado é quem tem a sessão,
 * e a API de analytics autentica um cliente, não uma pessoa. Ela nunca deveria
 * responder "quem é você" — daí este arquivo existir ao lado do proxy, e o Next
 * dar precedência à rota específica sobre o `[...caminho]`.
 *
 * O 401 aqui é redundante com `src/proxy.ts`, que já barra sem sessão. Fica
 * porque defesa em profundidade custa três linhas: se um dia alguém mexer no
 * `matcher` do proxy e esta rota escapar, ela continua fechada sozinha.
 */

import { cookies } from "next/headers";
import { COOKIE_DA_SESSAO, ler } from "@/lib/sessao";
import type { UsuarioAutenticado } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const sessao = ler((await cookies()).get(COOKIE_DA_SESSAO)?.value);
  if (!sessao) {
    return Response.json({ erro: "Sessão expirada ou ausente." }, { status: 401 });
  }

  const usuario: UsuarioAutenticado = {
    id: sessao.sub,
    nome: sessao.nome,
    email: sessao.email,
    perfil: sessao.perfil,
    // Unidade não é coletada pelo SZ Chat (ver consultas.py): não há o que
    // restringir, e inventar uma lista aqui daria a impressão de que há.
    unidadesPermitidas: "todas",
  };
  return Response.json(usuario);
}
