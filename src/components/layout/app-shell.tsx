"use client";

/**
 * Estrutura da aplicação: barra lateral + topo.
 *
 * A navegação já lê o perfil do usuário via `podeVer()`. Enquanto não há login,
 * o mock devolve um diretor — mas quando a autenticação entrar, o menu já
 * responde ao perfil sem refatoração.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Filter, Megaphone, MessagesSquare, Settings, ShieldCheck } from "lucide-react";
import { MARCA } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { useUsuario } from "@/hooks/use-dados";
import { ORIGEM_DOS_DADOS } from "@/services";
import { Badge } from "@/components/ui/badge";
import { ROTULO_PERFIL, podeVer, type AreaDaAplicacao } from "@/types";

const NAVEGACAO: readonly {
  area: AreaDaAplicacao;
  href: string;
  rotulo: string;
  Icone: typeof BarChart3;
  disponivel: boolean;
}[] = [
  { area: "funil", href: "/funil", rotulo: "Funil de conversas", Icone: Filter, disponivel: true },
  {
    area: "conversas",
    href: "/conversas",
    rotulo: "Conversas",
    Icone: MessagesSquare,
    disponivel: false,
  },
  {
    area: "marketing",
    href: "/marketing",
    rotulo: "Marketing",
    Icone: Megaphone,
    disponivel: false,
  },
  {
    area: "qualidade",
    href: "/qualidade",
    rotulo: "Qualidade",
    Icone: ShieldCheck,
    disponivel: false,
  },
  {
    area: "configuracoes",
    href: "/configuracoes",
    rotulo: "Configurações",
    Icone: Settings,
    disponivel: false,
  },
];

function Marca() {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="grid size-8 shrink-0 place-items-center rounded-md text-xs font-bold text-white"
        style={{ background: MARCA.cores.primaria }}
        aria-hidden="true"
      >
        {MARCA.monograma}
      </span>
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
  const perfil = usuario?.perfil ?? "diretor";

  return (
    <div className="bg-fundo flex min-h-dvh">
      <aside className="border-borda bg-superficie hidden w-60 shrink-0 flex-col border-r lg:flex">
        <div className="border-borda border-b p-4">
          <Marca />
        </div>
        <nav aria-label="Navegação principal" className="flex-1 space-y-0.5 p-2">
          {NAVEGACAO.filter((item) => podeVer(perfil, item.area)).map((item) => {
            const ativo = caminho.startsWith(item.href);
            const conteudo = (
              <>
                <item.Icone className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{item.rotulo}</span>
                {!item.disponivel && (
                  <span className="text-texto-fraco ml-auto text-[10px]">em breve</span>
                )}
              </>
            );
            const classe = cn(
              "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
              ativo
                ? "bg-marca-suave font-medium text-marca"
                : "text-texto-fraco hover:bg-fundo-sutil hover:text-texto",
              !item.disponivel && "cursor-not-allowed opacity-55 hover:bg-transparent",
            );

            return item.disponivel ? (
              <Link
                key={item.href}
                href={item.href}
                className={classe}
                aria-current={ativo ? "page" : undefined}
              >
                {conteudo}
              </Link>
            ) : (
              <span key={item.href} className={classe} aria-disabled="true">
                {conteudo}
              </span>
            );
          })}
        </nav>
        <p className="border-borda text-texto-fraco border-t p-3 text-[11px] leading-relaxed">
          {MARCA.assinatura}
        </p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-borda bg-superficie flex items-center justify-between gap-4 border-b px-4 py-3">
          <div className="lg:hidden">
            <Marca />
          </div>
          <div className="hidden lg:block">
            <h1 className="text-texto text-sm font-semibold">Funil de conversas</h1>
            <p className="text-texto-fraco text-[11px]">
              {MARCA.descricao} · dados extraídos das conversas comerciais
            </p>
          </div>

          <div className="flex items-center gap-3">
            {ORIGEM_DOS_DADOS === "mock" && (
              <Badge variante="atencao" title="A aplicação está exibindo dados de demonstração">
                Dados de demonstração
              </Badge>
            )}
            <div className="flex items-center gap-2">
              <div className="hidden text-right sm:block">
                <p className="text-texto text-xs leading-tight font-medium">
                  {usuario?.nome ?? "—"}
                </p>
                <p className="text-texto-fraco text-[11px] leading-tight">
                  {usuario ? ROTULO_PERFIL[usuario.perfil] : "carregando…"}
                </p>
              </div>
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
