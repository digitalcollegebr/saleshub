import "server-only";

/**
 * As permissões de quem está na sessão, lidas do coletor.
 *
 * Ficam fora do cookie de propósito (ver `lib/sessao.ts`): assinadas ali, marcar
 * uma caixa na tela de administração só valeria no próximo login, e desmarcar
 * não valeria nada até o cookie expirar.
 *
 * O preço é uma chamada ao coletor por pedido, e é por isso que existe o cache
 * de poucos segundos abaixo: uma navegação dispara várias consultas de dados
 * quase ao mesmo tempo, e todas perguntariam a mesma coisa. Curto o bastante
 * para que conceder acesso pareça imediato a quem está do outro lado do
 * telefone dizendo "agora tenta".
 */

import { configuracaoDoColetor } from "@/services/origem";
import { ehPermissao, type Permissao } from "@/types";

const VALIDADE_MS = 10_000;

const cache = new Map<string, { permissoes: Permissao[]; em: number }>();

/**
 * O administrador local não passa pelo coletor: ele existe justamente para
 * quando algo está fora do ar, e depender de uma consulta para saber que ele é
 * administrador o deixaria de fora na hora em que ele é necessário.
 */
export const PERMISSOES_DO_ADMIN_LOCAL: Permissao[] = ["administrador"];

export async function permissoesDe(email: string, nome: string): Promise<Permissao[]> {
  const agora = Date.now();
  const guardado = cache.get(email);
  if (guardado && agora - guardado.em < VALIDADE_MS) return guardado.permissoes;

  const coletor = configuracaoDoColetor();
  if (coletor.modo !== "api") {
    // Modo demonstração: dado fictício não é de ninguém, e exigir um
    // administrador para liberar o que já é inventado só atrapalharia quem está
    // avaliando a ferramenta. Em produção `API_URL` está preenchida e este ramo
    // não roda.
    return ["comercial", "cobranca", "atendimento", "administrador"];
  }

  let permissoes: Permissao[] = [];
  try {
    // `visto` registra o acesso e devolve as permissões na mesma ida — é o que
    // faz o usuário aparecer na lista do administrador já na primeira tentativa.
    const raiz = coletor.base.replace(/\/$/, "");
    const resposta = await fetch(`${raiz}/usuarios/visto`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${coletor.token}`,
      },
      body: JSON.stringify({ email, nome }),
      cache: "no-store",
    });
    if (resposta.ok) {
      const corpo = (await resposta.json()) as { permissoes?: unknown };
      permissoes = Array.isArray(corpo.permissoes)
        ? corpo.permissoes.filter((p): p is Permissao => typeof p === "string" && ehPermissao(p))
        : [];
    }
  } catch {
    // Coletor fora: sem permissão, e sem cachear o vazio — na próxima tentativa
    // pergunta de novo, senão uma falha de rede de um segundo deixaria a pessoa
    // trancada pelos dez seguintes.
    return [];
  }

  cache.set(email, { permissoes, em: agora });
  return permissoes;
}
