"use client";

/**
 * Estados de carregamento, erro e vazio.
 *
 * Três estados, três mensagens diferentes — e "sem dados" nunca é apresentado
 * como zero. Um funil vazio porque o filtro é restrito demais e um funil vazio
 * porque não houve conversa são situações distintas para quem decide.
 */

import { AlertTriangle, Inbox, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErroDaApi } from "@/services";

export function EsqueletoDeCartao({ altura = "h-24" }: { altura?: string }) {
  return <Skeleton className={`w-full ${altura}`} />;
}

export function EsqueletoDeBloco({ linhas = 5 }: { linhas?: number }) {
  return (
    <div className="space-y-2" role="status" aria-label="Carregando dados">
      {Array.from({ length: linhas }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-full" />
      ))}
      <span className="sr-only">Carregando…</span>
    </div>
  );
}

export function EstadoDeErro({
  erro,
  aoTentarNovamente,
}: {
  erro: unknown;
  aoTentarNovamente?: () => void;
}) {
  const daApi = erro instanceof ErroDaApi ? erro : null;
  const mensagem = daApi?.mensagemParaUsuario ?? "Não foi possível carregar estes dados.";
  const podeRepetir = daApi?.vaieAdiantarTentarDeNovo ?? true;

  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <div>
          <p className="font-medium">{mensagem}</p>
          {/* O corpo cru da resposta só aparece quando ajuda a agir: em 404 ele
              era `{"detail":"Not Found"}` na cara do usuário — ruído técnico que
              não diz nada a quem clicou num link velho. Continua no `ErroDaApi`
              para quem abrir o console. */}
          {daApi?.detalhe && daApi.categoria !== "nao_encontrado" && (
            <p className="mt-1 font-mono text-xs opacity-70">{daApi.detalhe}</p>
          )}
        </div>
      </div>
      {podeRepetir && aoTentarNovamente && (
        <button
          type="button"
          onClick={aoTentarNovamente}
          className="inline-flex items-center gap-1.5 rounded-md border border-red-300 px-2.5 py-1 text-xs font-medium hover:bg-red-100 focus:ring-2 focus:ring-red-400 focus:outline-none dark:border-red-800 dark:hover:bg-red-900"
        >
          <RefreshCw className="size-3" aria-hidden="true" />
          Tentar novamente
        </button>
      )}
    </div>
  );
}

export function EstadoVazio({
  titulo,
  descricao,
  acao,
}: {
  titulo: string;
  descricao: string;
  acao?: React.ReactNode;
}) {
  return (
    <div className="border-borda flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center">
      <Inbox className="text-texto-fraco size-5" aria-hidden="true" />
      <p className="text-texto text-sm font-medium">{titulo}</p>
      <p className="text-texto-fraco max-w-sm text-xs leading-relaxed">{descricao}</p>
      {acao}
    </div>
  );
}
