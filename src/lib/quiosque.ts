/**
 * O buraco do quiosque: o que a TV da sala lê sem sessão.
 *
 * A TV fica ligada meses numa parede. Sessão federada expira, e o que aparece na
 * reunião é a tela de login — daí `/tv` passar sem cookie. Só que a página busca
 * dados, então a liberação precisa alcançar a rota que ela consome, e **apenas**
 * ela.
 *
 * **O que isto torna público, para quem souber a URL:** os agregados das três
 * áreas — volume, primeira resposta, qualidade, sentimento, etapas do funil,
 * objeções, cursos — e o `ranking`, que traz nome e desempenho por atendente.
 * Não é só número. O que continua fechado é `/conversas`: nome, telefone e
 * conteúdo de cliente exigem sessão e permissão como antes.
 *
 * Lista fechada, e por isso `departamento` também é conferido: `painel/funil` é
 * a mesma rota para as três áreas, e `nao_identificado` — que exige
 * administrador no caminho autenticado — fica de fora justamente por não ser um
 * dos três rodízios da TV. Deixar o parâmetro livre abriria pelo quiosque um
 * recorte que a permissão nega.
 *
 * **Mora aqui, e não em cada tranca, porque são duas.** `proxy.ts` responde
 * antes de a rota existir; o proxy de dados confere de novo. A primeira versão
 * disto só ensinou a segunda, e o pedido morria na primeira com 401 — a TV ficou
 * mostrando erro. Duas cópias da regra sairiam de sincronia do mesmo jeito.
 */
const ROTA = "painel/funil";
const DEPARTAMENTOS = new Set(["", "cobranca", "atendimento_ao_aluno"]);

/** Prefixo do proxy de dados, para traduzir caminho de URL em rota do coletor. */
export const PREFIXO_DOS_DADOS = "/api/dados/";

export function ehPedidoDoQuiosque(rota: string, busca: URLSearchParams, metodo: string): boolean {
  if (metodo !== "GET") return false;
  if (rota !== ROTA) return false;
  return DEPARTAMENTOS.has(busca.get("departamento") ?? "");
}

/** O mesmo julgamento a partir do caminho completo, como o proxy o enxerga. */
export function ehCaminhoDoQuiosque(
  pathname: string,
  busca: URLSearchParams,
  metodo: string,
): boolean {
  if (!pathname.startsWith(PREFIXO_DOS_DADOS)) return false;
  return ehPedidoDoQuiosque(pathname.slice(PREFIXO_DOS_DADOS.length), busca, metodo);
}
