import "server-only";

/**
 * A porta: qual domínio entra, e a conta local de emergência.
 *
 * **Quem pode o quê não está aqui.** Permissão é conjunto marcado pelo
 * administrador na tela de usuários e vive na tabela `painel_usuarios` do
 * coletor. Este arquivo responde só "esta conta é do domínio?".
 */

export const DOMINIO_PERMITIDO = (
  process.env.DOMINIO_PERMITIDO ?? "digitalcollege.com.br"
).toLowerCase();

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
