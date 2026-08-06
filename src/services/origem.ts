/**
 * Quem responde os dados: a API real ou a demonstração.
 *
 * É decisão de **servidor, em execução** — não de build. A diferença importa: com
 * `NEXT_PUBLIC_*`, trocar demonstração por dados reais exigia reconstruir a imagem,
 * porque o Next grava o valor literalmente no bundle. Aqui basta preencher duas
 * variáveis no Coolify e reiniciar.
 *
 * O critério é a própria configuração: **se há para onde ligar, liga.** Não existe
 * um interruptor separado que possa ficar esquecido em desacordo com o resto —
 * `API_URL` e `SALESHUB_TOKEN` preenchidos são, ao mesmo tempo, a intenção e o meio.
 *
 * Este módulo só é importado por código de servidor (route handlers). O navegador
 * descobre o modo pela rota `/api/dados/estado`, nunca por variável de ambiente.
 */

export type ModoDeDados = "api" | "mock";

export interface ConfiguracaoDoColetor {
  readonly modo: ModoDeDados;
  readonly base: string;
  readonly token: string;
}

export function configuracaoDoColetor(): ConfiguracaoDoColetor {
  const base = (process.env.API_URL ?? "").trim();
  const token = (process.env.SALESHUB_TOKEN ?? "").trim();
  return { modo: base && token ? "api" : "mock", base, token };
}
