"use client";

/**
 * De qual operação é o painel que está aberto.
 *
 * O SZ Chat é compartilhado — comercial, cobrança e atendimento ao aluno usam a
 * mesma plataforma e caem na mesma tabela. Cada painel recorta a sua parte.
 *
 * **Por que contexto e não filtro na URL.** O departamento não é um recorte que o
 * usuário escolhe: é a identidade da página. `/cobranca` mostrando conversa
 * comercial não seria um filtro mal aplicado, seria a tela errada. Deixá-lo na
 * query string convidaria a apagar o parâmetro e ver a tela de cobrança com dados
 * do comercial — e o link compartilhado deixaria de significar o que diz.
 *
 * `/funil` fica **sem** departamento de propósito. Quem decide se o painel
 * comercial se restringe ao comercial é `FILTRAR_COMERCIAL_POR_DEPARTAMENTO`, no
 * coletor: o BI lê o mesmo banco, e uma decisão dessas tomada no frontend faria a
 * planilha e a tela discordarem sem ninguém saber qual está certa.
 */

import { createContext, useContext } from "react";

/** Chaves da taxonomia do coletor (`app/enrich/taxonomia.py`). */
export type ChaveDeDepartamento = "comercial" | "cobranca" | "atendimento_ao_aluno";

const ContextoDeDepartamento = createContext<ChaveDeDepartamento | undefined>(undefined);

export function ProvedorDeDepartamento({
  departamento,
  children,
}: {
  departamento: ChaveDeDepartamento;
  children: React.ReactNode;
}) {
  return (
    <ContextoDeDepartamento.Provider value={departamento}>
      {children}
    </ContextoDeDepartamento.Provider>
  );
}

/** `undefined` fora de um provedor — é o caso do painel comercial. */
export function useDepartamento(): ChaveDeDepartamento | undefined {
  return useContext(ContextoDeDepartamento);
}
