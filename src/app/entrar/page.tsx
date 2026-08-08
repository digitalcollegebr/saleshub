/**
 * Tela de entrada.
 *
 * O Google é o caminho: botão grande, primeiro. O usuário local fica atrás de um
 * `<details>` fechado — ele existe para quando o Workspace está fora, e deixá-lo
 * com o mesmo peso visual convidaria a usar senha local no dia a dia, que é
 * exatamente o que não se quer (é pela conta do domínio que a organização revoga
 * acesso quando alguém sai).
 *
 * Server Component de propósito: sem estado de cliente, sem JavaScript para
 * entrar. O formulário local é um POST HTML puro.
 */

import { adminLocalConfigurado } from "@/lib/acesso";
import { sessaoConfigurada } from "@/lib/sessao";
import { googleConfigurado } from "@/lib/google";
import { SimboloDaMarca } from "@/components/layout/marca";
import { MARCA } from "@/lib/brand";

export const dynamic = "force-dynamic";

const MOTIVOS: Record<string, string> = {
  sem_acesso:
    "Sua conta é do domínio, mas ainda não tem acesso ao painel. Peça a liberação a quem administra.",
  credenciais: "E-mail ou senha incorretos.",
  google_indisponivel: "A entrada pelo Google não está configurada neste servidor.",
  pedido_invalido: "Não foi possível concluir a entrada. Tente novamente.",
  sessao_expirada: "Sua sessão expirou. Entre novamente.",
};

export default async function PaginaDeEntrada({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; destino?: string }>;
}) {
  const { erro, destino } = await searchParams;
  const mensagem = erro ? (MOTIVOS[erro] ?? MOTIVOS.pedido_invalido) : null;

  // Sem segredo de sessão nada pode ser emitido nem conferido — o painel fica
  // fechado. Melhor dizer exatamente o que falta do que exibir um botão que
  // devolve erro: configuração pendente e defeito têm caras diferentes.
  if (!sessaoConfigurada()) {
    return (
      <main className="bg-fundo flex min-h-dvh items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center gap-3">
            <SimboloDaMarca tamanho={44} />
            <div>
              <h1 className="text-texto text-lg font-bold">{MARCA.produto}</h1>
              <p className="text-texto-fraco text-xs">{MARCA.organizacao}</p>
            </div>
          </div>
          <div className="border-borda bg-superficie rounded-cartao border p-4">
            <h2 className="text-texto text-sm font-semibold">Configuração pendente</h2>
            <p className="text-texto-fraco mt-2 text-xs leading-relaxed">
              O painel está fechado porque falta a configuração da sessão. Defina as variáveis
              abaixo no servidor e reimplante:
            </p>
            <ul className="text-texto-fraco mt-3 space-y-1 font-mono text-[11px]">
              <li>SESSAO_SEGREDO</li>
              <li>GOOGLE_CLIENT_ID · GOOGLE_CLIENT_SECRET</li>
              <li>ADMIN_EMAIL · ADMIN_SENHA_HASH</li>
            </ul>
            <p className="text-texto-fraco mt-3 text-[11px] leading-relaxed">
              As instruções de como gerar cada uma estão no README do projeto.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-fundo flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <SimboloDaMarca tamanho={44} />
          <div>
            <h1 className="text-texto text-lg font-bold">{MARCA.produto}</h1>
            <p className="text-texto-fraco text-xs">{MARCA.organizacao}</p>
          </div>
        </div>

        {mensagem && (
          <p
            role="alert"
            className="rounded-controle mb-4 border border-red-900 bg-red-950/50 px-3 py-2 text-sm text-red-200"
          >
            {mensagem}
          </p>
        )}

        {googleConfigurado() ? (
          <a
            href={`/api/auth/entrar${destino ? `?destino=${encodeURIComponent(destino)}` : ""}`}
            className="bg-marca hover:bg-marca-clara flex h-11 w-full items-center justify-center rounded-full text-sm font-semibold text-white transition-colors"
          >
            Entrar com o Google
          </a>
        ) : (
          <p className="text-texto-fraco text-sm">
            A entrada pelo Google não está configurada neste servidor.
          </p>
        )}

        <p className="text-texto-fraco mt-3 text-center text-[11px]">
          Somente contas @{process.env.DOMINIO_PERMITIDO ?? "digitalcollege.com.br"}
        </p>

        {adminLocalConfigurado() && (
          <details className="border-borda mt-8 border-t pt-4">
            <summary className="text-texto-fraco hover:text-texto cursor-pointer text-xs">
              O Google Workspace está indisponível
            </summary>
            <form method="POST" action="/api/auth/local" className="mt-3 space-y-2">
              <input
                type="email"
                name="email"
                required
                autoComplete="username"
                placeholder="E-mail do administrador"
                className="border-borda bg-superficie text-texto rounded-controle h-10 w-full border px-3 text-sm"
              />
              <input
                type="password"
                name="senha"
                required
                autoComplete="current-password"
                placeholder="Senha"
                className="border-borda bg-superficie text-texto rounded-controle h-10 w-full border px-3 text-sm"
              />
              <button
                type="submit"
                className="border-borda text-texto hover:bg-fundo-sutil h-10 w-full rounded-full border text-sm font-semibold"
              >
                Entrar com usuário local
              </button>
            </form>
          </details>
        )}
      </div>
    </main>
  );
}
