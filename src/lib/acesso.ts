import "server-only";

/**
 * A porta: qual domínio entra, e a conta local de emergência.
 *
 * **Quem pode o quê não está aqui.** Permissão é conjunto marcado pelo
 * administrador na tela de usuários e vive na tabela `painel_usuarios` do
 * coletor. Este arquivo responde só "esta conta é do domínio?".
 */

/**
 * Os domínios que entram, separados por vírgula em `DOMINIOS_PERMITIDOS`.
 *
 * Lista, e não um valor só, porque a operação passou a envolver mais de uma
 * empresa. `DOMINIO_PERMITIDO` no singular ainda é lido: quem já tinha a antiga
 * definida não perde o acesso num deploy, que é o jeito de a mudança não
 * derrubar ninguém sem aviso.
 *
 * Cada domínio precisa ser um Google Workspace de verdade. A conferência é feita
 * na claim `hd` do ID token, e `hd` só existe em conta Workspace — domínio que
 * seja só um Gmail com endereço bonito não tem o campo e é recusado, esteja ou
 * não nesta lista.
 */
export const DOMINIOS_PERMITIDOS: readonly string[] = (
  process.env.DOMINIOS_PERMITIDOS ??
  process.env.DOMINIO_PERMITIDO ??
  "digitalcollege.com.br"
)
  .split(",")
  .map((dominio) => dominio.trim().toLowerCase())
  .filter(Boolean);

export function dominioPermitido(dominio: string): boolean {
  return DOMINIOS_PERMITIDOS.includes(dominio.trim().toLowerCase());
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
