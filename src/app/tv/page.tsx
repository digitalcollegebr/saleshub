"use client";

/**
 * Painel de TV — modo quiosque para a sala da diretoria.
 *
 * Três visões girando a cada 60 s: comercial, cobrança, atendimento ao aluno.
 * O recorte é sempre o **mês vigente**, do dia 1º até agora, e vira sozinho na
 * virada do mês porque `intervaloDe("mes")` é recalculado a cada atualização.
 *
 * O que uma tela de TV exige e uma de mesa não:
 *
 * * **Cabe na tela, sem rolagem.** Ninguém rola uma TV. Todo o layout usa
 *   `dvh` e proporções, e o número é dimensionado em `clamp()` para crescer com
 *   a diagonal sem estourar em 1080p nem sumir em 4K.
 * * **Nada de esqueleto piscando.** `placeholderData` mantém o valor anterior
 *   durante a atualização; um flash de cinza a cada minuto seria visível da porta.
 * * **Contra burn-in.** Fundo preto, pouca área acesa, e o conteúdo troca de
 *   posição a cada 60 s — o rodízio já é a melhor defesa que existe. Por isso
 *   também não há nenhum elemento fixo brilhante: o rodapé é tênue e a barra de
 *   progresso é fina.
 *
 * A rota fica fora do `AppShell` (ver `app-shell.tsx`): barra lateral e cabeçalho
 * roubariam a área útil e não servem a ninguém do outro lado da sala.
 */

import { Suspense, useMemo } from "react";
import { Maximize, Minimize } from "lucide-react";
import { intervaloDe } from "@/hooks/use-filtros";
import { usePainelDoFunil } from "@/hooks/use-dados";
import { SEGUNDOS_POR_VISAO, useRodizio, useTelaAcesa, useTelaCheia } from "@/hooks/use-quiosque";
import { MARCA } from "@/lib/brand";
import {
  formatarDataHora,
  formatarDuracao,
  formatarInteiro,
  formatarPercentual,
} from "@/lib/format";
import { SimboloDaMarca } from "@/components/layout/marca";
import type { Indicador, PainelDoFunil } from "@/types";

/** Atualiza mais rápido que o rodízio: cada visão volta já com dado fresco. */
const ATUALIZAR_A_CADA = 45_000;

type Visao = {
  chave: string;
  titulo: string;
  departamento?: string;
  /** Chaves de indicador, na ordem em que aparecem. Lista fechada: ver abaixo. */
  destaques: readonly string[];
  /** O que a faixa de baixo mostra. */
  detalhe: "funil" | "repasse" | "sentimento";
};

/**
 * O que cada área mostra.
 *
 * Escolhido por pergunta, não por disponibilidade: numa TV cabem quatro números,
 * e o quinto tira atenção dos quatro. Cada visão responde "como estamos indo" e
 * "onde está travado".
 *
 * Cobrança e atendimento não têm funil nem indício de conversão — é vocabulário
 * comercial, e repeti-lo ali diria que a régua de vendas vale para eles.
 */
const VISOES: readonly Visao[] = [
  {
    chave: "comercial",
    titulo: "Comercial",
    // Sem departamento: segue a flag do coletor, como o /funil.
    destaques: ["conversas", "com_intencao", "taxa_de_repasse", "primeira_resposta"],
    detalhe: "funil",
  },
  {
    chave: "cobranca",
    titulo: "Cobrança",
    departamento: "cobranca",
    destaques: ["conversas", "sem_resposta", "primeira_resposta", "qualidade"],
    detalhe: "sentimento",
  },
  {
    chave: "atendimento",
    titulo: "Atendimento ao aluno",
    departamento: "atendimento_ao_aluno",
    destaques: ["conversas", "sem_resposta", "primeira_resposta", "qualidade"],
    detalhe: "sentimento",
  },
];

export default function PaginaDaTv() {
  return (
    <Suspense fallback={<div className="bg-fundo h-dvh" />}>
      <Quiosque />
    </Suspense>
  );
}

function Quiosque() {
  const { indice, restante } = useRodizio(VISOES.length);
  const { cheia, alternar } = useTelaCheia();
  const telaAcesaSuportada = useTelaAcesa(true);
  const visao = VISOES[indice];

  // Recalculado a cada render: na virada do mês a janela anda sozinha, sem
  // ninguém tocar na TV.
  const filtros = useMemo(() => {
    const { de, ate } = intervaloDe("mes");
    return { periodoInicio: de, periodoFim: ate, departamento: visao.departamento };
  }, [visao.departamento]);

  const painel = usePainelDoFunil(filtros, ATUALIZAR_A_CADA);
  const mes = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <main className="bg-fundo text-texto flex h-dvh flex-col overflow-hidden p-[2vh]">
      <header className="flex shrink-0 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <SimboloDaMarca tamanho={40} />
          <div>
            <h1 className="text-[clamp(1.1rem,2.2vw,2rem)] leading-tight font-bold">
              {visao.titulo}
            </h1>
            {/* `capitalize` do Tailwind maiúsculiza cada palavra e produz
                "Agosto De 2026". A primeira letra basta. */}
            <p className="text-texto-fraco text-[clamp(0.7rem,1vw,1rem)] first-letter:uppercase">
              {mes}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!telaAcesaSuportada && (
            <span className="text-texto-fraco text-[clamp(0.6rem,0.8vw,0.8rem)]">
              este navegador não mantém a tela acesa
            </span>
          )}
          <div className="flex gap-1.5">
            {VISOES.map((v, i) => (
              <span
                key={v.chave}
                className="h-1.5 w-8 rounded-full transition-colors"
                style={{
                  background: i === indice ? MARCA.cores.primaria : "var(--cor-borda)",
                }}
                aria-hidden="true"
              />
            ))}
          </div>
          <button
            type="button"
            onClick={alternar}
            aria-label={cheia ? "Sair da tela cheia" : "Ocupar a tela inteira"}
            className="text-texto-fraco hover:text-texto hover:bg-fundo-sutil rounded-full p-2"
          >
            {cheia ? (
              <Minimize className="size-[clamp(1rem,1.6vw,1.5rem)]" aria-hidden="true" />
            ) : (
              <Maximize className="size-[clamp(1rem,1.6vw,1.5rem)]" aria-hidden="true" />
            )}
          </button>
        </div>
      </header>

      {painel.data ? (
        <Conteudo painel={painel.data} visao={visao} />
      ) : (
        <div className="text-texto-fraco flex flex-1 items-center justify-center text-[clamp(1rem,2vw,1.5rem)]">
          {painel.isError ? "Sem conexão com o coletor" : "Carregando…"}
        </div>
      )}

      <footer className="text-texto-fraco flex shrink-0 items-center justify-between text-[clamp(0.6rem,0.85vw,0.9rem)]">
        <span>
          {MARCA.produto} · {MARCA.organizacao}
        </span>
        {painel.data && <span>atualizado {formatarDataHora(painel.data.geradoEm)}</span>}
      </footer>

      {/* Progresso do rodízio: fio no rodapé, não relógio piscando. */}
      <div className="bg-borda absolute inset-x-0 bottom-0 h-[3px]" aria-hidden="true">
        <div
          className="h-full transition-[width] duration-1000 ease-linear"
          style={{
            width: `${((SEGUNDOS_POR_VISAO - restante) / SEGUNDOS_POR_VISAO) * 100}%`,
            background: MARCA.cores.primaria,
          }}
        />
      </div>
    </main>
  );
}

function Conteudo({ painel, visao }: { painel: PainelDoFunil; visao: Visao }) {
  const porChave = new Map<string, Indicador>();
  for (const i of [...painel.indicadores, ...painel.repasse.indicadores]) porChave.set(i.chave, i);
  const destaques = visao.destaques.map((c) => porChave.get(c)).filter(Boolean) as Indicador[];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-[2vh] py-[2vh]">
      <section className="grid shrink-0 grid-cols-4 gap-[1.5vw]">
        {destaques.map((i) => (
          <Numerao key={i.chave} indicador={i} />
        ))}
      </section>

      <section className="min-h-0 flex-1">
        {visao.detalhe === "funil" ? (
          <Barras
            titulo="Etapas do funil"
            itens={painel.funil
              .filter((e) => !e.terminal)
              .map((e) => ({ rotulo: e.rotulo, valor: e.alcancaram, cor: e.cor }))}
          />
        ) : visao.detalhe === "repasse" ? (
          <Barras
            titulo="Tempo até o consultor"
            itens={painel.repasse.tempoAteOConsultor.map((f) => ({
              rotulo: f.rotulo,
              valor: f.total,
              cor: MARCA.cores.primaria,
            }))}
          />
        ) : (
          <div className="grid h-full grid-cols-2 gap-[1.5vw]">
            <Barras
              titulo="Sentimento do contato"
              itens={painel.sentimentos.map((s, n) => ({
                rotulo: s.rotulo,
                valor: s.total,
                cor: MARCA.serie[n % MARCA.serie.length],
              }))}
            />
            <Barras
              titulo="Quem mais atendeu"
              itens={painel.ranking.slice(0, 6).map((l, n) => ({
                rotulo: l.atendenteNome ?? `Atendente ${l.atendenteId}`,
                valor: l.conversas,
                cor: MARCA.serie[n % MARCA.serie.length],
              }))}
            />
          </div>
        )}
      </section>
    </div>
  );
}

/** Um número grande. O rótulo é pequeno de propósito: o número é o que se lê de longe. */
function Numerao({ indicador }: { indicador: Indicador }) {
  const texto =
    indicador.valor === null
      ? "—"
      : indicador.formato === "percentual"
        ? formatarPercentual(indicador.valor)
        : indicador.formato === "duracao_segundos"
          ? formatarDuracao(indicador.valor)
          : formatarInteiro(indicador.valor);

  return (
    <div className="border-borda bg-superficie rounded-cartao flex flex-col justify-center border px-[1.5vw] py-[1.6vh]">
      <p className="text-texto-fraco truncate text-[clamp(0.65rem,1vw,1.05rem)]">
        {indicador.rotulo}
      </p>
      <p className="mt-[0.6vh] text-[clamp(1.8rem,4.4vw,4.5rem)] leading-none font-bold tabular-nums">
        {texto}
      </p>
    </div>
  );
}

function Barras({
  titulo,
  itens,
}: {
  titulo: string;
  itens: readonly { rotulo: string; valor: number; cor: string }[];
}) {
  const teto = Math.max(1, ...itens.map((i) => i.valor));

  return (
    <div className="border-borda bg-superficie rounded-cartao flex h-full min-h-0 flex-col border p-[1.5vw]">
      <h2 className="text-texto-fraco shrink-0 text-[clamp(0.7rem,1vw,1.05rem)] font-semibold tracking-wide uppercase">
        {titulo}
      </h2>
      <ul className="mt-[1.2vh] flex min-h-0 flex-1 flex-col justify-around gap-[0.6vh]">
        {itens.map((i) => (
          <li key={i.rotulo} className="flex items-center gap-[1vw]">
            <span className="text-texto-fraco w-[26%] shrink-0 truncate text-[clamp(0.65rem,1vw,1.1rem)]">
              {i.rotulo}
            </span>
            <span className="bg-fundo-sutil h-[1.6vh] min-h-[8px] flex-1 overflow-hidden rounded-full">
              <span
                className="block h-full rounded-full"
                style={{ width: `${(i.valor / teto) * 100}%`, background: i.cor }}
              />
            </span>
            <span className="w-[12%] shrink-0 text-right text-[clamp(0.75rem,1.2vw,1.4rem)] font-semibold tabular-nums">
              {formatarInteiro(i.valor)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
