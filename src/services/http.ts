/**
 * Cliente HTTP. Só existe para o dia em que a API real entrar no ar — a aplicação
 * fala com `SalesHubApi`, nunca com este arquivo.
 */

import { ErroDaApi, categoriaPorStatus } from "./erros";

const TEMPO_LIMITE_MS = 20_000;

/**
 * A base normalmente é **relativa** (`/api/dados`): o navegador fala com o proxy da
 * própria aplicação, que é quem guarda o token da API de analytics. Como `new URL`
 * exige base absoluta, a origem entra aqui.
 */
export function montarUrl(baseUrl: string, caminho: string): URL {
  const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const origem = typeof window === "undefined" ? "http://localhost" : window.location.origin;
  const absoluta = base.startsWith("/") ? new URL(base, origem).toString() : base;
  return new URL(caminho.replace(/^\//, ""), absoluta);
}

export async function pedir<T>(
  baseUrl: string,
  caminho: string,
  opcoes: { busca?: Record<string, string | undefined>; sinal?: AbortSignal } = {},
): Promise<T> {
  const url = montarUrl(baseUrl, caminho);
  for (const [chave, valor] of Object.entries(opcoes.busca ?? {})) {
    if (valor !== undefined && valor !== "") url.searchParams.set(chave, valor);
  }

  const controle = new AbortController();
  const limite = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);
  opcoes.sinal?.addEventListener("abort", () => controle.abort());

  let resposta: Response;
  try {
    resposta = await fetch(url, {
      signal: controle.signal,
      headers: { Accept: "application/json" },
    });
  } catch (causa) {
    throw new ErroDaApi("Falha de rede", "rede", { causa });
  } finally {
    clearTimeout(limite);
  }

  if (!resposta.ok) {
    const detalhe = await resposta.text().catch(() => undefined);
    throw new ErroDaApi(`HTTP ${resposta.status}`, categoriaPorStatus(resposta.status), {
      status: resposta.status,
      detalhe: detalhe?.slice(0, 400),
    });
  }

  try {
    return (await resposta.json()) as T;
  } catch (causa) {
    throw new ErroDaApi("Resposta não é JSON", "formato", { causa });
  }
}
