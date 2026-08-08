"use client";

/**
 * Estrutura da aplicação: barra lateral + topo.
 *
 * O menu se monta a partir das PERMISSÕES da sessão (`podeVer()`), então quem
 * tem só cobrança não enxerga a existência do funil. Esconder não é a proteção —
 * a rota é barrada em `src/proxy.ts` e no proxy de dados —, mas mostrar um item
 * que devolve "sem acesso" ao clique é convidar para uma porta fechada.
 */

import { usePathname } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { MARCA } from "@/lib/brand";
import { FundoDaMarca, SimboloDaMarca } from "./marca";
import { GavetaDeNavegacao, ITENS, ListaDeNavegacao, useGaveta } from "./navegacao";
import { useOrigemDosDados, useUsuario } from "@/hooks/use-dados";
import { Badge } from "@/components/ui/badge";
import { ROTULO_PERMISSAO, type Permissao } from "@/types";

/**
 * O que o cabeçalho anuncia depende de onde se está.
 *
 * Era fixo em "Funil de conversas · dados extraídos das conversas comerciais",
 * o que passou a ser uma afirmação falsa em `/cobranca`: a tela mostra conversa de
 * cobrança, e o topo dizia que era comercial. Num painel, um rótulo errado é pior
 * que um rótulo ausente — ele afirma.
 */
function secaoDoCaminho(caminho: string): { titulo: string; subtitulo: string } {
  const item = ITENS.find((n) => caminho.startsWith(n.href));
  if (!item) return { titulo: MARCA.produto, subtitulo: MARCA.descricao };
  return {
    titulo: item.rotulo,
    // `MARCA.descricao` carrega a palavra "comercial" — ela descreve o produto
    // como nasceu, e fora do funil deixaria o topo dizendo "comercial" na tela de
    // cobrança de novo, só que mais escondido.
    subtitulo:
      item.area === "funil"
        ? `${MARCA.descricao} · dados extraídos das conversas comerciais`
        : "Conversation Analytics · área identificada pela análise da conversa",
  };
}

function Marca() {
  return (
    <div className="flex items-center gap-2.5">
      <SimboloDaMarca tamanho={32} />
      <span className="min-w-0">
        <span className="text-texto block truncate text-sm leading-tight font-semibold">
          {MARCA.produto}
        </span>
        <span className="text-texto-fraco block truncate text-[11px] leading-tight">
          {MARCA.organizacao}
        </span>
      </span>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const caminho = usePathname();
  const { data: usuario } = useUsuario();
  const { data: origem } = useOrigemDosDados();
  // Sem usuário carregado ainda, nenhuma permissão: o menu não pode piscar itens
  // que a pessoa talvez não possa ver.
  const permissoes: readonly Permissao[] = usuario?.permissoes ?? [];
  const secao = secaoDoCaminho(caminho);
  const gaveta = useGaveta();

  // O painel de TV ocupa a tela inteira: barra lateral e cabeçalho roubariam
  // área útil e não servem a ninguém do outro lado da sala. Ver app/tv/page.tsx.
  if (caminho.startsWith("/tv")) return <>{children}</>;
  // A tela de entrada é anterior à sessão: não há permissão para montar menu.
  if (caminho.startsWith("/entrar")) return <>{children}</>;

  return (
    <div className="flex min-h-dvh">
      <FundoDaMarca />
      <GavetaDeNavegacao permissoes={permissoes} aberta={gaveta.aberta} aoFechar={gaveta.fechar} />
      <aside className="border-borda bg-superficie hidden w-60 shrink-0 flex-col border-r lg:flex">
        <div className="border-borda border-b p-4">
          <Marca />
        </div>
        <ListaDeNavegacao permissoes={permissoes} />
        <p className="border-borda text-texto-fraco border-t p-3 text-[11px] leading-relaxed">
          {MARCA.assinatura}
        </p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-borda bg-superficie flex items-center justify-between gap-4 border-b px-4 py-3">
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={gaveta.abrir}
              aria-label="Abrir navegação"
              className="text-texto-fraco hover:text-texto hover:bg-fundo-sutil -ml-1 rounded-full p-2"
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>
            <Marca />
          </div>
          <div className="hidden lg:block">
            <h1 className="text-texto text-sm font-semibold">{secao.titulo}</h1>
            <p className="text-texto-fraco text-[11px]">{secao.subtitulo}</p>
          </div>

          <div className="flex items-center gap-3">
            {origem?.modo === "mock" && (
              <Badge variante="atencao" title={origem.diagnostico}>
                Dados de demonstração
              </Badge>
            )}
            <div className="flex items-center gap-2">
              <div className="hidden text-right sm:block">
                <p className="text-texto text-xs leading-tight font-medium">
                  {usuario?.nome ?? "—"}
                </p>
                <p className="text-texto-fraco text-[11px] leading-tight">
                  {usuario
                    ? usuario.permissoes.includes("administrador")
                      ? ROTULO_PERMISSAO.administrador
                      : usuario.permissoes.map((p) => ROTULO_PERMISSAO[p]).join(" · ") ||
                        "sem acesso"
                    : "carregando…"}
                </p>
              </div>
              <form method="POST" action="/api/auth/sair">
                <button
                  type="submit"
                  aria-label="Sair"
                  title="Sair"
                  className="text-texto-fraco hover:text-texto hover:bg-fundo-sutil rounded-full p-2"
                >
                  <LogOut className="size-4" aria-hidden="true" />
                </button>
              </form>
              <span
                className="bg-fundo-sutil text-texto-fraco grid size-8 place-items-center rounded-full text-xs font-semibold"
                aria-hidden="true"
              >
                {(usuario?.nome ?? "?")
                  .split(" ")
                  .slice(0, 2)
                  .map((p) => p[0])
                  .join("")}
              </span>
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
