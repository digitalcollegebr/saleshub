import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * `standalone` empacota só o necessário para rodar — servidor, dependências
   * usadas e assets — num diretório próprio. A imagem final fica em torno de
   * 200 MB em vez de arrastar o node_modules inteiro de desenvolvimento.
   */
  output: "standalone",
};

export default nextConfig;
