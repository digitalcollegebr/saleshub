"use client";

/**
 * Analytics de Cobrança.
 *
 * Mesmas conversas, mesma plataforma, outra operação — e por isso outro painel.
 * O que aparece aqui é atendimento medido; o funil comercial fica de fora de
 * propósito (ver `PainelOperacional`).
 */

import { Suspense } from "react";
import { EsqueletoDeBloco } from "@/components/dados/estados";
import { PainelOperacional } from "@/components/painel/painel-operacional";
import { ProvedorDeDepartamento } from "@/hooks/use-departamento";

export default function PaginaDeCobranca() {
  return (
    // `useSearchParams`, dentro de `useFiltros`, exige limite de Suspense.
    <Suspense fallback={<EsqueletoDeBloco linhas={8} />}>
      <ProvedorDeDepartamento departamento="cobranca">
        <PainelOperacional
          titulo="Cobrança"
          descricao="Conversas cuja intenção predominante é regularização financeira: mensalidade vencida, segunda via, negociação de dívida e acordo de pagamento. Não há valor recuperado aqui — a conversa registra o combinado, não o pagamento."
        />
      </ProvedorDeDepartamento>
    </Suspense>
  );
}
