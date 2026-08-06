/**
 * Ponto único de acesso a dados.
 *
 * A aplicação inteira importa `api` daqui e fala com `SalesHubApi` — nenhum
 * componente sabe o que está atrás, e é isso que permitiu trocar a origem dos
 * dados sem tocar em uma linha de tela.
 */

import { ApiHttp } from "./api-http";
import type { SalesHubApi } from "./contrato";

/**
 * O navegador fala com a **própria origem**, sempre.
 *
 * Não há mais escolha de adaptador aqui — e é essa a mudança que torna a ligação
 * com os dados reais uma configuração, não um rebuild. Quem decide entre
 * demonstração e API real é o servidor, em `/api/dados` (`src/app/api/dados`), que
 * guarda o token e conhece `API_URL`. O bundle que vai para o navegador é
 * **idêntico nos dois modos**.
 *
 * Apontar o navegador direto para o coletor exigiria o token no bundle — isto é,
 * um token público. Por isso a URL do coletor é `API_URL`, variável de **servidor**,
 * e nunca uma `NEXT_PUBLIC_*`.
 *
 * Para saber qual modo está valendo (o selo "Dados de demonstração"), pergunte ao
 * servidor: `useOrigemDosDados()` em `src/hooks/use-dados.ts`.
 */
export const api: SalesHubApi = new ApiHttp("/api/dados");

export type { SalesHubApi } from "./contrato";
export { ErroDaApi } from "./erros";
