import "server-only";

/**
 * Cifra os valores sensíveis que a configuração guarda no coletor.
 *
 * **Por que cifrar se o banco é interno.** O coletor guarda conversa de cliente
 * e já é o ativo mais sensível da operação; somar a ele o segredo do OAuth
 * significaria que um dump do banco não vaza só dados, vaza a capacidade de se
 * passar pela aplicação no Google. Cifrado, o `pg_dump` é inútil para isso — e o
 * coletor, que não tem a chave, não consegue decifrar nem por engano.
 *
 * AES-256-GCM: além de esconder, ele **autentica**. Trocar um byte do texto
 * cifrado faz a decifragem falhar em vez de devolver lixo que o resto do código
 * trataria como um client secret esquisito.
 *
 * A chave vem de `SESSAO_SEGREDO`, via SHA-256 para chegar aos 32 bytes exatos
 * que o AES-256 exige. Consequência que precisa estar escrita: **trocar
 * `SESSAO_SEGREDO` torna ilegível o que foi cifrado com ele.** Além de derrubar
 * as sessões, é preciso digitar o segredo do Google de novo na tela.
 */

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ALGORITMO = "aes-256-gcm";

function chave(): Buffer {
  const bruto = process.env.SESSAO_SEGREDO ?? "";
  if (bruto.length < 32) {
    throw new Error("SESSAO_SEGREDO ausente: sem ele não há como cifrar a configuração");
  }
  return createHash("sha256").update(bruto).digest();
}

/** `iv.tag.conteudo`, tudo em base64url. */
export function cifrar(texto: string): string {
  const iv = randomBytes(12);
  const cifra = createCipheriv(ALGORITMO, chave(), iv);
  const conteudo = Buffer.concat([cifra.update(texto, "utf8"), cifra.final()]);
  return [iv, cifra.getAuthTag(), conteudo].map((b) => b.toString("base64url")).join(".");
}

/** Devolve `null` para qualquer defeito — inclusive chave trocada. */
export function decifrar(guardado: string | null | undefined): string | null {
  if (!guardado) return null;
  const partes = guardado.split(".");
  if (partes.length !== 3) return null;
  try {
    const [iv, tag, conteudo] = partes.map((p) => Buffer.from(p, "base64url"));
    const decifra = createDecipheriv(ALGORITMO, chave(), iv);
    decifra.setAuthTag(tag);
    return Buffer.concat([decifra.update(conteudo), decifra.final()]).toString("utf8");
  } catch {
    return null;
  }
}
