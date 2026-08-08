/**
 * A marca da Digital College e a arte que ela gera.
 *
 * O logotipo é um `>_` — prompt de terminal — num quadrado magenta de cantos
 * arredondados. Vale ler o desenho: o chevron é a mesma forma que se repete na
 * arte institucional, então o padrão de fundo aqui não é ornamento inventado, é
 * a própria marca em escala grande.
 *
 * **Por que SVG e não a imagem.** A arte que serviu de referência é um PNG rosa
 * claro. Num painel escuro ela precisaria ser reescrita de qualquer jeito, e um
 * bitmap de fundo custa banda, borra em tela 2x e não acompanha mudança de cor.
 * Em SVG o mesmo desenho herda `currentColor`, escala sem perda e cabe em
 * poucos bytes dentro do HTML.
 */

/** O quadrado magenta com `>_`. `tamanho` em px — é usado em 32 e em 28. */
export function SimboloDaMarca({ tamanho = 32 }: { tamanho?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center"
      style={{
        width: tamanho,
        height: tamanho,
        // 28% do lado: é a proporção do quadrado do logotipo original, que é
        // bem mais arredondado que o raio de card.
        borderRadius: tamanho * 0.28,
        background: "var(--cor-marca)",
      }}
      aria-hidden="true"
    >
      <svg
        width={tamanho * 0.56}
        height={tamanho * 0.56}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fff"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* chevron + underscore: o prompt do terminal */}
        <path d="M5 5l7 6-7 6" />
        <path d="M14 18h6" />
      </svg>
    </span>
  );
}

/**
 * Arte de fundo: a malha de pontos da marca, nos cantos.
 *
 * A arte institucional tem chevrons grandes, mas ela é **rosa clara sobre
 * branco** — ali eles são um tom acima do fundo. Sobre preto, magenta a 4% ainda
 * brilha: a primeira versão desta tela pôs um chevron de 256px no canto e ele
 * lia como erro de renderização, não como textura. Num painel denso, fundo que
 * disputa atenção com número é fundo que atrapalha.
 *
 * Sobrou o que funciona no escuro: a malha de pontos, longe da coluna de
 * conteúdo. O chevron saiu até de 64px a 5% — sobre preto ele continuava lendo
 * como uma seta apontando para nada, e uma seta é um convite a clicar. O `>_`
 * fica onde ele significa alguma coisa: no logotipo.
 *
 * `aria-hidden` e `pointer-events-none` porque é decoração pura: não pode ser
 * lida por leitor de tela nem interceptar clique.
 */
export function FundoDaMarca() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10"
      style={{ background: "var(--cor-fundo)" }}
    >
      {/* Malha: gradiente radial repetido, não SVG — é uma linha de CSS e o
          navegador desenha sem nó de DOM nenhum. */}
      <div className="absolute top-6 right-6 h-40 w-40" style={{ ...MALHA, opacity: 0.28 }} />
      <div
        className="absolute bottom-8 left-8 hidden h-32 w-32 lg:block"
        style={{ ...MALHA, opacity: 0.2 }}
      />
    </div>
  );
}

/** Pontos de 1px a cada 28px, na cor da marca. */
const MALHA: React.CSSProperties = {
  backgroundImage: "radial-gradient(var(--cor-marca) 1.1px, transparent 1.1px)",
  backgroundSize: "28px 28px",
};
