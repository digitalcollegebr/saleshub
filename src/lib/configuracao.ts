import "server-only";

/**
 * A configuração de autenticação, editável pela tela.
 *
 * **Precedência: variável de ambiente vence.** Se `GOOGLE_CLIENT_ID` está no
 * ambiente, a tela mostra o valor como "definido fora daqui" e não deixa
 * editar. O contrário — a tela sobrescrever o ambiente — produziria o pior
 * defeito de configuração que existe: alguém edita o campo, salva, nada muda, e
 * não há nada na tela explicando por quê.
 *
 * O segredo **nunca volta** para o navegador. A tela recebe apenas
 * `temSegredo: true`, e o campo fica vazio com a marca de já configurado. Quem
 * quiser trocar digita o novo; quem não mexer não apaga o que existe.
 */

import { configuracaoDoColetor } from "@/services/origem";
import { cifrar, decifrar } from "./cofre";

export interface ConfiguracaoDeAutenticacao {
  googleClientId: string;
  googleClientSecret: string;
  dominioPermitido: string;
  urlPublica: string;
  /** Chaves que vêm do ambiente e por isso não são editáveis na tela. */
  travadasPeloAmbiente: string[];
}

// Cache curto: `urlDeAutorizacao` e `googleConfigurado` leem isto no mesmo
// pedido, e ir duas vezes ao coletor para responder a mesma pergunta é desperdício.
let cache: { valor: ConfiguracaoDeAutenticacao; em: number } | null = null;
const VALIDADE_MS = 10_000;

async function doColetor(): Promise<Map<string, { valor: string; cifrado: boolean }>> {
  const coletor = configuracaoDoColetor();
  if (coletor.modo !== "api") return new Map();
  try {
    const raiz = coletor.base.replace(/\/$/, "");
    const resposta = await fetch(`${raiz}/configuracao`, {
      headers: { Authorization: `Bearer ${coletor.token}` },
      cache: "no-store",
    });
    if (!resposta.ok) return new Map();
    const corpo = (await resposta.json()) as {
      itens?: { chave: string; valor: string; cifrado: boolean }[];
    };
    return new Map(
      (corpo.itens ?? []).map((i) => [i.chave, { valor: i.valor, cifrado: i.cifrado }]),
    );
  } catch {
    // Coletor fora: a tela de entrada cai no que houver no ambiente. Não é hora
    // de derrubar o login por causa de uma leitura de configuração.
    return new Map();
  }
}

export async function configuracaoDeAutenticacao(): Promise<ConfiguracaoDeAutenticacao> {
  if (cache && Date.now() - cache.em < VALIDADE_MS) return cache.valor;

  const guardado = await doColetor();
  const travadas: string[] = [];

  const ler = (chaveEnv: string, chaveBanco: string): string => {
    const doAmbiente = (process.env[chaveEnv] ?? "").trim();
    if (doAmbiente) {
      travadas.push(chaveBanco);
      return doAmbiente;
    }
    const item = guardado.get(chaveBanco);
    if (!item?.valor) return "";
    return item.cifrado ? (decifrar(item.valor) ?? "") : item.valor;
  };

  const valor: ConfiguracaoDeAutenticacao = {
    googleClientId: ler("GOOGLE_CLIENT_ID", "google_client_id"),
    googleClientSecret: ler("GOOGLE_CLIENT_SECRET", "google_client_secret"),
    dominioPermitido: ler("DOMINIO_PERMITIDO", "dominio_permitido") || "digitalcollege.com.br",
    urlPublica: ler("URL_PUBLICA", "url_publica"),
    travadasPeloAmbiente: travadas,
  };

  cache = { valor, em: Date.now() };
  return valor;
}

/** O que a tela pode ver. O segredo vira um booleano. */
export async function configuracaoParaTela() {
  const c = await configuracaoDeAutenticacao();
  return {
    googleClientId: c.googleClientId,
    temSegredo: Boolean(c.googleClientSecret),
    dominioPermitido: c.dominioPermitido,
    urlPublica: c.urlPublica,
    travadasPeloAmbiente: c.travadasPeloAmbiente,
  };
}

/**
 * Grava. Campo ausente não é tocado; string vazia apaga.
 *
 * A distinção existe por causa do segredo: a tela sempre manda o campo vazio
 * quando o usuário não digitou nada, e tratar vazio como "apagar" faria salvar
 * o domínio derrubar a autenticação inteira.
 */
export async function salvarConfiguracao(
  mudancas: Partial<
    Record<
      "googleClientId" | "googleClientSecret" | "dominioPermitido" | "urlPublica",
      string | null
    >
  >,
  por: string,
): Promise<void> {
  const coletor = configuracaoDoColetor();
  if (coletor.modo !== "api") throw new Error("sem coletor configurado");

  const mapa: Record<string, { chave: string; cifrar: boolean }> = {
    googleClientId: { chave: "google_client_id", cifrar: false },
    googleClientSecret: { chave: "google_client_secret", cifrar: true },
    dominioPermitido: { chave: "dominio_permitido", cifrar: false },
    urlPublica: { chave: "url_publica", cifrar: false },
  };

  const itens = Object.entries(mudancas)
    .filter(([, v]) => v !== undefined)
    .map(([campo, v]) => {
      const alvo = mapa[campo];
      if (v === null || v === "") return { chave: alvo.chave, valor: null, cifrado: false };
      return {
        chave: alvo.chave,
        valor: alvo.cifrar ? cifrar(v) : v,
        cifrado: alvo.cifrar,
      };
    });

  const raiz = coletor.base.replace(/\/$/, "");
  const resposta = await fetch(`${raiz}/configuracao`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${coletor.token}`,
    },
    body: JSON.stringify({ itens, por }),
    cache: "no-store",
  });
  if (!resposta.ok) throw new Error(`coletor recusou a gravação (${resposta.status})`);

  cache = null; // a próxima leitura precisa ver o que acabou de ser salvo
}
