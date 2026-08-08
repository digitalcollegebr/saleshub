/**
 * O endereço público da aplicação, para montar redirect.
 *
 * Dentro do container o Next escuta em `0.0.0.0:3000`, e é isso que aparece em
 * `pedido.url`: quem chegou pelo Traefik pediu `saleshub.digitalcollege.com.br`,
 * mas o processo nunca vê esse nome. Redirect montado sobre `pedido.url` sai com
 * `Location: http://0.0.0.0:3000/…` e o navegador recusa a conexão — falha que
 * só aparece em produção, porque em `npm run dev` a origem do pedido é a mesma
 * que o navegador usou e tudo funciona.
 *
 * `URL_PUBLICA` vence quando existe; sem ela, a origem do pedido é o melhor
 * palpite disponível e serve bem no desenvolvimento.
 *
 * Não confiar no cabeçalho `Host` é deliberado: ele vem do cliente, e um pedido
 * com `Host` forjado transformaria qualquer redirect nosso num salto para fora.
 */
export function baseDaAplicacao(pedido: { url: string }): string {
  const configurada = process.env.URL_PUBLICA?.trim().replace(/\/$/, "");
  return configurada || new URL(pedido.url).origin;
}

/** Um caminho interno (`/funil`) resolvido contra o endereço público. */
export function urlDoApp(caminho: string, pedido: { url: string }): URL {
  return new URL(caminho, `${baseDaAplicacao(pedido)}/`);
}
