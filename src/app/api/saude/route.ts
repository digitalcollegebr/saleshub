/**
 * Sonda de saúde do container.
 *
 * Responde sem tocar em dependência externa de propósito: o healthcheck responde
 * "este processo está servindo", não "a API de analytics está no ar". Misturar as
 * duas coisas faria o orquestrador reiniciar o frontend por causa de um problema
 * que reiniciar não resolve.
 */

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({
    status: "ok",
    aplicacao: "saleshub",
    origemDosDados: process.env.NEXT_PUBLIC_USAR_MOCKS !== "false" ? "mock" : "api",
    em: new Date().toISOString(),
  });
}
