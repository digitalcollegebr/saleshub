/**
 * Quem é o usuário da sessão.
 *
 * Rota **local**, não encaminhada: quem sabe quem está logado é quem tem a sessão,
 * e a API de analytics autentica um cliente, não uma pessoa. Ela nunca deveria
 * responder "quem é você" — daí este arquivo existir ao lado do proxy, e o Next
 * dar precedência à rota específica sobre o `[...caminho]`.
 *
 * É aqui que a autenticação de verdade encosta: trocar o perfil fixo abaixo pela
 * sessão do provedor de identidade. `AppShell` e `podeVer()` já consomem o perfil,
 * então nenhum componente muda.
 */

import type { UsuarioAutenticado } from "@/types";

export const dynamic = "force-dynamic";

const DEMONSTRACAO: UsuarioAutenticado = {
  id: "u-demo",
  nome: "Usuário de demonstração",
  email: "demo@digitalcollege.com.br",
  perfil: "diretor",
  unidadesPermitidas: "todas",
};

export function GET(): Response {
  // TODO(autenticação): ler a sessão e devolver o usuário real.
  return Response.json(DEMONSTRACAO);
}
