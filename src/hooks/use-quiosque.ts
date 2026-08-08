"use client";

/**
 * O que um painel de TV precisa e um painel de mesa não.
 *
 * Três coisas que ninguém vai fazer a cada troca de turno: pôr em tela cheia,
 * impedir a TV de dormir e trocar de visão. Todas ficam aqui.
 */

import { useCallback, useEffect, useRef, useState } from "react";

/** Segundos em cada visão antes de girar. Escolha do usuário: 60. */
export const SEGUNDOS_POR_VISAO = 60;

/**
 * Rodízio das visões.
 *
 * `Date.now()` em vez de contar ticks: um `setInterval` de 1s acumula desvio ao
 * longo de horas, e esta tela fica ligada o dia inteiro. Ancorando no relógio, a
 * troca acontece no segundo certo mesmo depois de 8 h.
 */
export function useRodizio(quantidade: number, segundos = SEGUNDOS_POR_VISAO) {
  const [indice, definirIndice] = useState(0);
  const [restante, definirRestante] = useState(segundos);
  // Inicializado no efeito, não no render: `Date.now()` durante o render é
  // impuro e o React reclama com razão — o mesmo render em duas passadas daria
  // dois valores diferentes.
  const trocaEm = useRef(0);

  useEffect(() => {
    trocaEm.current = Date.now() + segundos * 1000;
    const id = setInterval(() => {
      const faltam = Math.max(0, Math.round((trocaEm.current - Date.now()) / 1000));
      definirRestante(faltam);
      if (faltam === 0) {
        trocaEm.current = Date.now() + segundos * 1000;
        definirIndice((i) => (i + 1) % quantidade);
      }
    }, 250);
    return () => clearInterval(id);
  }, [quantidade, segundos]);

  return { indice, restante };
}

/**
 * Tela cheia. Só pode ser pedida dentro de um gesto do usuário — daí ser um
 * botão e não algo automático ao abrir a página.
 */
export function useTelaCheia() {
  const [cheia, definirCheia] = useState(false);

  useEffect(() => {
    const aoMudar = () => definirCheia(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", aoMudar);
    return () => document.removeEventListener("fullscreenchange", aoMudar);
  }, []);

  const alternar = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      // Navegador pode recusar (iframe sem permissão, política do sistema). Não
      // há o que fazer além de deixar o botão como está — quebrar a tela por
      // causa de uma promessa recusada seria pior que não entrar em tela cheia.
    }
  }, []);

  return { cheia, alternar };
}

/**
 * Mantém a tela acesa.
 *
 * `navigator.wakeLock` é o único jeito de um navegador pedir isso, e existe
 * desde o Chrome 84 — a TV precisa rodar Chrome/Edge recente. O lock **cai**
 * sozinho quando a aba perde visibilidade, então é preciso repedir no
 * `visibilitychange`; sem isso, a tela apaga na primeira vez que alguém alterna
 * de aba e nunca mais volta a segurar.
 *
 * Onde não houver suporte, `suportado` fica falso e a tela avisa em vez de
 * prometer silenciosamente algo que não acontece.
 */
export function useTelaAcesa(ativo: boolean) {
  const [suportado, definirSuportado] = useState(true);
  const trava = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!ativo) return;

    let cancelado = false;

    const pedir = async () => {
      try {
        if (!("wakeLock" in navigator)) throw new Error("sem suporte a wakeLock");
        trava.current = await navigator.wakeLock.request("screen");
      } catch {
        if (!cancelado) definirSuportado(false);
      }
    };

    const aoVoltar = () => {
      if (document.visibilityState === "visible") void pedir();
    };

    // `queueMicrotask` porque a checagem de suporte falha de forma síncrona onde
    // não há `wakeLock`, e chamar setState dentro do corpo do efeito dispara
    // render em cascata. Adiando um tick, o efeito termina antes.
    queueMicrotask(() => void pedir());
    document.addEventListener("visibilitychange", aoVoltar);

    return () => {
      cancelado = true;
      document.removeEventListener("visibilitychange", aoVoltar);
      void trava.current?.release();
      trava.current = null;
    };
  }, [ativo]);

  return suportado;
}
