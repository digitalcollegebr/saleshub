"use client";

/**
 * O que a pessoa vê quando não pode ver a página.
 *
 * Dois estados diferentes, e confundi-los é o erro que faz alguém achar que o
 * sistema quebrou:
 *
 * * **Sem permissão nenhuma** — autenticou e ainda não foi liberada. É o estado
 *   de todo primeiro acesso, e a resposta é "procure o administrador", com o
 *   e-mail à vista para ele saber o que pedir.
 * * **Sem esta permissão** — tem acesso ao painel, mas não a esta área. Aqui a
 *   mensagem é outra, e o menu ao lado mostra para onde ela pode ir.
 *
 * Esconder o item do menu não é a proteção — a rota é barrada em `src/proxy.ts`
 * e o dado, no proxy de dados. Isto é a camada de explicar, não a de trancar.
 */

import { ShieldAlert, UserRoundX } from "lucide-react";
import { useUsuario } from "@/hooks/use-dados";
import { EsqueletoDeBloco } from "@/components/dados/estados";
import { podeVer, semAcesso, type AreaDaAplicacao } from "@/types";

export function GuardaDeArea({
  area,
  children,
}: {
  area: AreaDaAplicacao;
  children: React.ReactNode;
}) {
  const { data: usuario, isPending } = useUsuario();

  // Enquanto não se sabe quem é, não se mostra nem o conteúdo nem a recusa:
  // exibir "sem acesso" por um instante e depois o painel é pior que esperar.
  if (isPending || !usuario) return <EsqueletoDeBloco linhas={6} />;

  if (semAcesso(usuario.permissoes)) {
    return (
      <Aviso
        Icone={UserRoundX}
        titulo="Seu acesso ainda não foi liberado"
        corpo={
          <>
            Você entrou como <strong className="text-texto">{usuario.email}</strong>, mas ainda não
            recebeu permissão para nenhuma área. Peça a um administrador do SalesHub que libere o
            seu acesso — ele já vê o seu nome na lista de usuários.
          </>
        }
      />
    );
  }

  if (!podeVer(usuario.permissoes, area)) {
    return (
      <Aviso
        Icone={ShieldAlert}
        titulo="Você não tem acesso a esta área"
        corpo={
          <>
            Seu acesso não inclui esta parte do painel. Use o menu para ir a uma das áreas
            liberadas, ou peça a um administrador que amplie a sua permissão.
          </>
        }
      />
    );
  }

  return <>{children}</>;
}

function Aviso({
  Icone,
  titulo,
  corpo,
}: {
  Icone: typeof ShieldAlert;
  titulo: string;
  corpo: React.ReactNode;
}) {
  return (
    <div className="border-borda rounded-cartao mx-auto mt-8 flex max-w-lg flex-col items-center gap-3 border border-dashed px-6 py-12 text-center">
      <Icone className="text-texto-fraco size-7" aria-hidden="true" />
      <h1 className="text-texto text-base font-semibold">{titulo}</h1>
      <p className="text-texto-fraco max-w-md text-sm leading-relaxed">{corpo}</p>
    </div>
  );
}
