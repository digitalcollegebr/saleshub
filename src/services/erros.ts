/**
 * Tratamento centralizado de erro.
 *
 * A interface precisa distinguir três situações que exigem respostas diferentes:
 * o servidor recusou (o usuário pode agir), a rede falhou (tentar de novo resolve)
 * e a resposta veio num formato inesperado (o usuário não tem o que fazer, mas
 * merece saber). Um `Error` genérico obriga cada tela a adivinhar isso.
 */

export type CategoriaDeErro = "rede" | "autenticacao" | "permissao" | "servidor" | "formato";

export class ErroDaApi extends Error {
  readonly categoria: CategoriaDeErro;
  readonly status?: number;
  readonly detalhe?: string;

  constructor(
    mensagem: string,
    categoria: CategoriaDeErro,
    opcoes?: { status?: number; detalhe?: string; causa?: unknown },
  ) {
    super(mensagem, { cause: opcoes?.causa });
    this.name = "ErroDaApi";
    this.categoria = categoria;
    this.status = opcoes?.status;
    this.detalhe = opcoes?.detalhe;
  }

  /** Texto pronto para o usuário: o que houve e o que fazer a respeito. */
  get mensagemParaUsuario(): string {
    switch (this.categoria) {
      case "rede":
        return "Não foi possível falar com o servidor. Verifique a conexão e tente de novo.";
      case "autenticacao":
        return "Sua sessão expirou. Entre novamente para continuar.";
      case "permissao":
        return "Seu perfil não tem acesso a estes dados.";
      case "formato":
        return "O servidor respondeu num formato inesperado. Avise o time técnico.";
      default:
        return "O servidor não conseguiu responder agora. Tente novamente em instantes.";
    }
  }

  /** Repetir só faz sentido quando a falha é transitória. */
  get vaieAdiantarTentarDeNovo(): boolean {
    return this.categoria === "rede" || this.categoria === "servidor";
  }
}

export function categoriaPorStatus(status: number): CategoriaDeErro {
  if (status === 401) return "autenticacao";
  if (status === 403) return "permissao";
  return "servidor";
}

export function comoErroDaApi(erro: unknown): ErroDaApi {
  if (erro instanceof ErroDaApi) return erro;
  return new ErroDaApi("Falha inesperada", "servidor", { causa: erro });
}
