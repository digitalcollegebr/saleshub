/**
 * Quem entra, e no quê.
 *
 * **Permissão é conjunto, não papel.** O administrador marca caixas, e a mesma
 * pessoa responde por cobrança e atendimento sem que exista um perfil
 * "cobrança+atendimento" inventado para ela. Foi por isso que o `PerfilDeAcesso`
 * único saiu daqui.
 *
 * **Autenticar não é autorizar.** Quem entra pelo Google e ainda não recebeu
 * caixa nenhuma tem `permissoes: []` e não vê tela alguma — só o aviso para
 * procurar o administrador. O padrão é negar; conceder algo por omissão daria
 * conversa de cliente a qualquer conta nova do domínio.
 */

export const PERMISSOES = ["comercial", "cobranca", "atendimento", "administrador"] as const;

export type Permissao = (typeof PERMISSOES)[number];

export const ROTULO_PERMISSAO: Record<Permissao, string> = {
  comercial: "Comercial",
  cobranca: "Cobrança",
  atendimento: "Atendimento ao aluno",
  administrador: "Administrador",
};

export const EXPLICACAO_PERMISSAO: Record<Permissao, string> = {
  comercial: "Funil de conversas e a lista de conversas.",
  cobranca: "Painel de cobrança.",
  atendimento: "Painel de atendimento ao aluno.",
  administrador: "Tudo, incluindo conceder permissões a outras pessoas.",
};

export interface UsuarioAutenticado {
  readonly id: string;
  readonly nome: string;
  readonly email: string;
  readonly permissoes: readonly Permissao[];
}

/** Uma linha da tela de administração. */
export interface UsuarioDoPainel {
  readonly email: string;
  readonly nome: string | null;
  readonly permissoes: readonly Permissao[];
  readonly primeiroAcessoEm: string | null;
  readonly ultimoAcessoEm: string | null;
}

/** Áreas da aplicação, para o menu e para o controle de acesso. */
export type AreaDaAplicacao =
  | "funil"
  | "cobranca"
  | "atendimento"
  | "conversas"
  | "tv"
  | "usuarios"
  | "marketing"
  | "qualidade"
  | "configuracoes";

/**
 * Qual permissão abre cada área.
 *
 * `conversas` e `tv` pedem QUALQUER uma das três operacionais: a lista de
 * conversas e o rodízio da TV atravessam departamentos por natureza. Vale
 * registrar o limite — hoje quem tem só cobrança enxerga, na lista, conversa
 * comercial também. Separar isso exige filtrar a lista pela permissão, e é
 * trabalho próprio.
 */
const OPERACIONAIS: readonly Permissao[] = ["comercial", "cobranca", "atendimento"];

const EXIGIDA: Record<AreaDaAplicacao, readonly Permissao[]> = {
  funil: ["comercial"],
  cobranca: ["cobranca"],
  atendimento: ["atendimento"],
  conversas: OPERACIONAIS,
  tv: OPERACIONAIS,
  usuarios: ["administrador"],
  marketing: ["comercial"],
  qualidade: OPERACIONAIS,
  configuracoes: ["administrador"],
};

/** O administrador enxerga tudo — inclusive o que ainda não existe. */
export function podeVer(permissoes: readonly Permissao[], area: AreaDaAplicacao): boolean {
  if (permissoes.includes("administrador")) return true;
  return EXIGIDA[area].some((p) => permissoes.includes(p));
}

/** Autenticou mas não recebeu nada. É o estado de todo primeiro acesso. */
export function semAcesso(permissoes: readonly Permissao[]): boolean {
  return permissoes.length === 0;
}

export function ehPermissao(valor: string): valor is Permissao {
  return (PERMISSOES as readonly string[]).includes(valor);
}
