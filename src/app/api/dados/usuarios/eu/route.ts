/**
 * Quem é o usuário da sessão, e o que ele pode.
 *
 * Rota **local**, não encaminhada: quem sabe quem está logado é quem tem a
 * sessão, e a API de analytics autentica um cliente, não uma pessoa.
 *
 * As permissões vêm do coletor a cada chamada (com cache curto) em vez de
 * viajarem no cookie — é o que faz "marquei a caixa, tenta agora" funcionar.
 * A mesma chamada registra o acesso, e é por isso que alguém aparece na lista do
 * administrador já na primeira tentativa de entrar.
 */

import { cookies } from "next/headers";
import { COOKIE_DA_SESSAO, ler } from "@/lib/sessao";
import { PERMISSOES_DO_ADMIN_LOCAL, permissoesDe } from "@/lib/permissoes-do-usuario";
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
    permissoes:
      sessao.via === "local"
        ? PERMISSOES_DO_ADMIN_LOCAL
        : await permissoesDe(sessao.email, sessao.nome),
  };
  return Response.json(usuario);
}
