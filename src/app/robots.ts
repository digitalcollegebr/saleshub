import type { MetadataRoute } from "next";

/**
 * Painel gerencial não vai para buscador.
 *
 * Vale desde já, com dados de demonstração: uma vez indexada, a URL circula — e
 * quando ela apontar para dados reais, tirar do índice é bem mais trabalhoso do
 * que nunca ter entrado.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: "/" }],
  };
}
