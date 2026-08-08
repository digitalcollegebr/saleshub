/**
 * Perfis de acesso. A autenticação real ainda não existe, mas o tipo já existe:
 * telas e itens de menu consultam `podeVer()` desde agora, então ligar um provedor
 * de identidade depois não vira refatoração de componente.
 */

export type PerfilDeAcesso =
  "diretor" | "gestor_de_vendas" | "gestor_de_marketing" | "administrador";

export interface UsuarioAutenticado {
  readonly id: string;
  readonly nome: string;
  readonly email: string;
  readonly perfil: PerfilDeAcesso;
  readonly unidadesPermitidas: readonly string[] | "todas";
}

export const ROTULO_PERFIL: Record<PerfilDeAcesso, string> = {
  diretor: "Diretoria",
  gestor_de_vendas: "Gestão de vendas",
  gestor_de_marketing: "Gestão de marketing",
  administrador: "Administração",
};

/** Áreas da aplicação, para o menu e para o controle de acesso futuro. */
export type AreaDaAplicacao =
  "funil" | "cobranca" | "atendimento" | "conversas" | "marketing" | "qualidade" | "configuracoes";

/**
 * Cobrança e atendimento ao aluno ficam **fora** de `gestor_de_vendas` e de
 * `gestor_de_marketing` de propósito: separar as operações no dado e depois
 * mostrar as três a todo mundo desfaria metade do ponto. Diretoria vê tudo porque
 * a leitura dela é da operação inteira.
 */
const ACESSO_POR_PERFIL: Record<PerfilDeAcesso, readonly AreaDaAplicacao[]> = {
  diretor: ["funil", "cobranca", "atendimento", "conversas", "marketing", "qualidade"],
  gestor_de_vendas: ["funil", "conversas", "qualidade"],
  gestor_de_marketing: ["funil", "conversas", "marketing"],
  administrador: [
    "funil",
    "cobranca",
    "atendimento",
    "conversas",
    "marketing",
    "qualidade",
    "configuracoes",
  ],
};

export function podeVer(perfil: PerfilDeAcesso, area: AreaDaAplicacao): boolean {
  return ACESSO_POR_PERFIL[perfil].includes(area);
}
