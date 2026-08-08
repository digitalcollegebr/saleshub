"use client";

/**
 * A navegação, e as duas formas de apresentá-la.
 *
 * Abaixo de `lg` a barra lateral não cabe, e antes disto ela simplesmente
 * desaparecia — no celular o painel abria em `/funil` e não havia como alcançar
 * Cobrança, Atendimento ou Conversas. Não era um problema de estética: metade do
 * produto ficava inacessível em telefone.
 *
 * A lista é a mesma nos dois lugares (`ITENS`), e o filtro de perfil também: uma
 * segunda cópia da navegação é uma cópia que diverge no dia em que alguém
 * acrescenta uma área.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Filter,
  GraduationCap,
  Megaphone,
  MessagesSquare,
  Receipt,
  MonitorPlay,
  UsersRound,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { podeVer, type AreaDaAplicacao, type Permissao } from "@/types";

export const ITENS: readonly {
  area: AreaDaAplicacao;
  href: string;
  rotulo: string;
  /** Rótulo curto para a barra inferior do celular, onde não cabe o completo. */
  curto: string;
  Icone: typeof BarChart3;
  disponivel: boolean;
}[] = [
  {
    area: "funil",
    href: "/funil",
    rotulo: "Funil de conversas",
    curto: "Funil",
    Icone: Filter,
    disponivel: true,
  },
  // As três operações que compartilham o SZ Chat, juntas e no topo: a separação
  // entre elas é o que o painel passou a garantir, e o menu é onde isso se vê.
  {
    area: "cobranca",
    href: "/cobranca",
    rotulo: "Cobrança",
    curto: "Cobrança",
    Icone: Receipt,
    disponivel: true,
  },
  {
    area: "atendimento",
    href: "/atendimento",
    rotulo: "Atendimento ao aluno",
    curto: "Aluno",
    Icone: GraduationCap,
    disponivel: true,
  },
  {
    area: "conversas",
    href: "/conversas",
    rotulo: "Conversas",
    curto: "Conversas",
    Icone: MessagesSquare,
    disponivel: true,
  },
  {
    area: "tv",
    href: "/tv",
    rotulo: "Painel de TV",
    curto: "TV",
    Icone: MonitorPlay,
    disponivel: true,
  },
  {
    area: "usuarios",
    href: "/usuarios",
    rotulo: "Usuários",
    curto: "Usuários",
    Icone: UsersRound,
    disponivel: true,
  },
  {
    area: "marketing",
    href: "/marketing",
    rotulo: "Marketing",
    curto: "Marketing",
    Icone: Megaphone,
    disponivel: false,
  },
  {
    area: "qualidade",
    href: "/qualidade",
    rotulo: "Qualidade",
    curto: "Qualidade",
    Icone: ShieldCheck,
    disponivel: false,
  },
  {
    area: "configuracoes",
    href: "/configuracoes",
    rotulo: "Configurações",
    curto: "Config",
    Icone: Settings,
    disponivel: true,
  },
];

export function itensVisiveis(permissoes: readonly Permissao[]) {
  return ITENS.filter((item) => podeVer(permissoes, item.area));
}

/** Lista vertical — a barra lateral do desktop e o corpo da gaveta do celular. */
export function ListaDeNavegacao({
  permissoes,
  aoNavegar,
}: {
  permissoes: readonly Permissao[];
  aoNavegar?: () => void;
}) {
  const caminho = usePathname();

  return (
    <nav aria-label="Navegação principal" className="flex-1 space-y-0.5 p-2">
      {itensVisiveis(permissoes).map((item) => {
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
          "rounded-controle flex items-center gap-2.5 px-2.5 py-2.5 text-sm transition-colors",
          ativo
            ? "bg-marca-suave text-marca font-medium"
            : "text-texto-fraco hover:bg-fundo-sutil hover:text-texto",
          !item.disponivel && "cursor-not-allowed opacity-55 hover:bg-transparent",
        );

        return item.disponivel ? (
          <Link
            key={item.href}
            href={item.href}
            className={classe}
            aria-current={ativo ? "page" : undefined}
            onClick={aoNavegar}
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
  );
}

/**
 * Gaveta do celular.
 *
 * Fecha ao navegar, no Esc e no clique fora — as três saídas que alguém tenta
 * sem pensar. Trava a rolagem do corpo enquanto aberta, senão o fundo desliza
 * atrás do painel e o dedo perde a referência.
 */
export function GavetaDeNavegacao({
  permissoes,
  aberta,
  aoFechar,
}: {
  permissoes: readonly Permissao[];
  aberta: boolean;
  aoFechar: () => void;
}) {
  useEffect(() => {
    if (!aberta) return;
    const noEsc = (e: KeyboardEvent) => e.key === "Escape" && aoFechar();
    document.addEventListener("keydown", noEsc);
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", noEsc);
      document.body.style.overflow = anterior;
    };
  }, [aberta, aoFechar]);

  if (!aberta) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Fechar navegação"
        onClick={aoFechar}
        className="absolute inset-0 bg-black/70"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navegação principal"
        className="border-borda bg-superficie absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r"
      >
        <div className="border-borda flex items-center justify-between border-b p-4">
          <span className="text-texto text-sm font-semibold">Navegação</span>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar navegação"
            className="text-texto-fraco hover:text-texto rounded-full p-1.5"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <ListaDeNavegacao permissoes={permissoes} aoNavegar={aoFechar} />
      </div>
    </div>
  );
}

/**
 * Hook do estado da gaveta, com um cuidado: fechar quando a tela cresce.
 *
 * Sem isso, girar o telefone para paisagem deixa a gaveta aberta por cima da
 * barra lateral que acabou de aparecer — duas navegações na tela ao mesmo tempo.
 */
export function useGaveta() {
  const [aberta, definirAberta] = useState(false);

  useEffect(() => {
    const largura = window.matchMedia("(min-width: 1024px)");
    const aoMudar = () => largura.matches && definirAberta(false);
    largura.addEventListener("change", aoMudar);
    return () => largura.removeEventListener("change", aoMudar);
  }, []);

  return { aberta, abrir: () => definirAberta(true), fechar: () => definirAberta(false) };
}
