/**
 * Ponto único de escolha entre mock e API real.
 *
 * A aplicação inteira importa `api` daqui. Nenhum componente sabe qual adaptador
 * está atrás — é o que torna a substituição um ajuste de ambiente.
 */

import { ApiHttp } from "./api-http";
import type { SalesHubApi } from "./contrato";
import { ApiMock } from "./mock/api-mock";

const usarMocks = process.env.NEXT_PUBLIC_USAR_MOCKS !== "false";
const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";

function escolherAdaptador(): SalesHubApi {
  if (usarMocks) return new ApiMock();
  if (!baseUrl) {
    // Falhar aqui, no boot, é melhor que falhar em cada tela: sem URL, a
    // aplicação não tem como funcionar e o erro precisa dizer exatamente isso.
    throw new Error(
      "NEXT_PUBLIC_API_URL não configurada. Defina a URL da API ou mantenha NEXT_PUBLIC_USAR_MOCKS=true.",
    );
  }
  return new ApiHttp(baseUrl);
}

export const api: SalesHubApi = escolherAdaptador();
export const ORIGEM_DOS_DADOS: "mock" | "api" = usarMocks ? "mock" : "api";

export type { SalesHubApi } from "./contrato";
export { ErroDaApi } from "./erros";
