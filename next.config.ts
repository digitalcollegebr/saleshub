import type { NextConfig } from "next";

/**
 * Cabeçalhos de segurança.
 *
 * O Next não envia nenhum por padrão. Como o SalesHub fica num domínio público e
 * hoje **não tem autenticação**, o mínimo é impedir que ele seja embutido em outro
 * site (clickjacking) e que o navegador tente adivinhar tipo de conteúdo.
 *
 * `frame-ancestors 'none'` é a versão moderna do X-Frame-Options; mantemos os dois
 * porque navegadores antigos só entendem o segundo.
 */
const CABECALHOS_DE_SEGURANCA = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Painel gerencial não precisa de câmera, microfone nem localização.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  /**
   * `standalone` empacota só o necessário para rodar — servidor, dependências
   * usadas e assets — num diretório próprio. A imagem final fica em torno de
   * 290 MB em vez de arrastar o node_modules inteiro de desenvolvimento.
   */
  output: "standalone",

  /** Não anunciar a stack em cabeçalho: não ajuda ninguém além de quem varre. */
  poweredByHeader: false,

  async headers() {
    return [{ source: "/:caminho*", headers: CABECALHOS_DE_SEGURANCA }];
  },
};

export default nextConfig;
