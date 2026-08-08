import "server-only";

/**
 * Quem entra, e com qual perfil.
 *
 * Autenticar responde "quem é você"; isto responde "e daí". O Google confirma a
 * identidade e o domínio, mas não sabe que alguém é diretor ou gestor de vendas
 * — essa é informação nossa, e vive em `ACESSOS`.
 *
 * **A entrada é por domínio.** Quem tem conta `@digitalcollege.com.br` autentica;
 * o resto não passa, e a conferência acontece no `hd` do ID token, não numa lista
 * daqui. `ACESSOS` serve só para ELEVAR perfil de quem precisa de mais que o
 * padrão.
 *
 * Formato de `ACESSOS`, separado por vírgula:
 *
 *     daniel@digitalcollege.com.br:administrador,ana@digitalcollege.com.br:diretor
 *
 * `PERFIL_PADRAO` é o que todo mundo do domínio recebe sem estar mapeado. O
 * padrão do código é `gestor_de_vendas` — funil, conversas e qualidade, sem
 * cobrança nem atendimento ao aluno — porque conceder o menor conjunto útil é o
 * comportamento certo quando a configuração está omissa. Definir a variável como
 * vazio volta ao "só entra quem está em ACESSOS", se um dia o domínio crescer
 * a ponto de isso incomodar.
 */

import { PERFIS_VALIDOS, type PerfilDeAcesso } from "@/types";

export const DOMINIO_PERMITIDO = (
  process.env.DOMINIO_PERMITIDO ?? "digitalcollege.com.br"
).toLowerCase();

/** Mapa e-mail → perfil, lido a cada chamada: trocar acesso não exige rebuild. */
function acessos(): Map<string, PerfilDeAcesso> {
  const mapa = new Map<string, PerfilDeAcesso>();
  for (const entrada of (process.env.ACESSOS ?? "").split(",")) {
    const [email, perfil] = entrada.split(":").map((p) => p?.trim().toLowerCase());
    if (!email || !perfil) continue;
    // Perfil desconhecido não vira acesso silencioso com poder indefinido:
    // `podeVer` receberia uma chave que não existe e o menu sairia vazio, o que
    // se lê como bug em vez de como configuração errada.
    if (!(PERFIS_VALIDOS as readonly string[]).includes(perfil)) continue;
    mapa.set(email, perfil as PerfilDeAcesso);
  }
  return mapa;
}

/** Perfil padrão de quem é do domínio e não está mapeado. Vazio = ninguém entra. */
function perfilPadrao(): PerfilDeAcesso | null {
  const bruto = (process.env.PERFIL_PADRAO ?? "gestor_de_vendas").trim().toLowerCase();
  if (!bruto) return null;
  return (PERFIS_VALIDOS as readonly string[]).includes(bruto) ? (bruto as PerfilDeAcesso) : null;
}

/**
 * O perfil de quem está entrando, ou `null` se não pode entrar.
 *
 * Só é chamada depois de o domínio ter sido confirmado no ID token — ela não
 * confere domínio, e não deve: duas checagens do mesmo fato em lugares
 * diferentes é como uma delas fica para trás.
 */
export function perfilDe(email: string | null | undefined): PerfilDeAcesso | null {
  if (!email) return null;
  return acessos().get(email.trim().toLowerCase()) ?? perfilPadrao();
}

/** Só para o painel de diagnóstico: quantos acessos estão configurados. */
export function quantidadeDeAcessos(): number {
  return acessos().size;
}

/**
 * O administrador local — a saída de emergência.
 *
 * Existe para dois casos reais: o Google fora do ar (ou a conta bloqueada) e a
 * TV da sala, que fica ligada meses e não deve depender de uma sessão federada
 * que expira. É uma conta só, com senha guardada como hash scrypt.
 *
 * `ADMIN_SENHA_HASH` tem o formato `sal:hash`, ambos em hex. Para gerar:
 *
 *     node -e "const c=require('node:crypto');const s=c.randomBytes(16).toString('hex');
 *     console.log(s+':'+c.scryptSync(process.argv[1],s,64).toString('hex'))" 'a-senha'
 */
export function adminLocalConfigurado(): boolean {
  return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_SENHA_HASH);
}
