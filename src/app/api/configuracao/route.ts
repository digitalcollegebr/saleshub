/**
 * Leitura e gravação da configuração de autenticação.
 *
 * Rota local do Next, não do proxy de dados: ela cifra e decifra, e a chave
 * (`SESSAO_SEGREDO`) só existe aqui. Passar isto pelo `[...caminho]` obrigaria o
 * proxy a entender o formato dos campos, que não é trabalho dele.
 *
 * Só administrador. O `GET` devolve `temSegredo` no lugar do segredo — ele nunca
 * volta para o navegador, nem para quem tem direito de trocá-lo.
 */

import { cookies } from "next/headers";
import { COOKIE_DA_SESSAO, ler } from "@/lib/sessao";
import { permissoesDe } from "@/lib/permissoes-do-usuario";
import { configuracaoParaTela, salvarConfiguracao } from "@/lib/configuracao";

export const dynamic = "force-dynamic";

async function sessaoAdmin() {
  const sessao = ler((await cookies()).get(COOKIE_DA_SESSAO)?.value);
  if (!sessao) return null;
  if (sessao.via === "local") return sessao;
  const permissoes = await permissoesDe(sessao.email, sessao.nome);
  return permissoes.includes("administrador") ? sessao : null;
}

export async function GET(): Promise<Response> {
  if (!(await sessaoAdmin())) {
    return Response.json({ erro: "Requer permissão de administrador." }, { status: 403 });
  }
  return Response.json(await configuracaoParaTela());
}

export async function PUT(pedido: Request): Promise<Response> {
  const sessao = await sessaoAdmin();
  if (!sessao) {
    return Response.json({ erro: "Requer permissão de administrador." }, { status: 403 });
  }

  const corpo = (await pedido.json()) as Record<string, unknown>;
  const texto = (campo: string) =>
    typeof corpo[campo] === "string" ? (corpo[campo] as string).trim() : undefined;

  try {
    await salvarConfiguracao(
      {
        googleClientId: texto("googleClientId"),
        // Campo vazio significa "não mexi": a tela nunca recebe o segredo de
        // volta, então ela sempre o envia em branco quando o usuário não digitou.
        // Tratar vazio como apagar faria salvar o domínio derrubar o login.
        googleClientSecret: texto("googleClientSecret") || undefined,
        dominioPermitido: texto("dominioPermitido"),
        urlPublica: texto("urlPublica"),
      },
      sessao.email,
    );
  } catch (erro) {
    return Response.json(
      { erro: erro instanceof Error ? erro.message : "Falha ao gravar." },
      { status: 502 },
    );
  }

  return Response.json(await configuracaoParaTela());
}
