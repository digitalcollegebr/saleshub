"use client";

/**
 * Analytics de Atendimento ao Aluno.
 *
 * Quem já é aluno e procura suporte: acesso à plataforma, documento, horário,
 * problema acadêmico. Não é lead, e medir com a régua comercial diria que a área
 * inteira tem intenção de compra zero — o que é verdade e não informa nada.
 */

import { Suspense } from "react";
import { EsqueletoDeBloco } from "@/components/dados/estados";
import { PainelOperacional } from "@/components/painel/painel-operacional";
import { ProvedorDeDepartamento } from "@/hooks/use-departamento";

export default function PaginaDeAtendimento() {
  return (
    <Suspense fallback={<EsqueletoDeBloco linhas={8} />}>
      <ProvedorDeDepartamento departamento="atendimento_ao_aluno">
        <PainelOperacional
          titulo="Atendimento ao aluno"
          descricao="Conversas de quem já é aluno: acesso à plataforma, documentos e declarações, horários, dúvida acadêmica e trancamento. Quem pergunta sobre matrícula futura é comercial, não aluno — a classificação segue a intenção, não a palavra."
        />
      </ProvedorDeDepartamento>
    </Suspense>
  );
}
