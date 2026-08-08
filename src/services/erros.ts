/**
 * Tratamento centralizado de erro.
 *
 * A interface precisa distinguir situações que exigem respostas diferentes: a rede
 * falhou (tentar de novo resolve), o servidor recusou, a sessão caiu, o perfil não
 * alcança, o recurso não existe (tentar de novo nunca vai resolver) e a resposta
 * veio num formato inesperado. Um `Error` genérico obriga cada tela a adivinhar
 * isso — e a errar, como quando 404 virava "o servidor não conseguiu responder".
 */

export type CategoriaDeErro =
  "rede" | "autenticacao" | "permissao" | "nao_encontrado" | "servidor" | "formato";

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
      case "nao_encontrado":
        return "Esta conversa não existe ou não está mais disponível.";
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
  // 404 caía em "servidor", e o resultado era uma tela dizendo que o servidor
  // falhou, com um botão "Tentar novamente" que nunca ia funcionar — link velho
  // ou id digitado errado viravam suspeita de incidente.
  if (status === 404) return "nao_encontrado";
  return "servidor";
}

export function comoErroDaApi(erro: unknown): ErroDaApi {
  if (erro instanceof ErroDaApi) return erro;
  return new ErroDaApi("Falha inesperada", "servidor", { causa: erro });
}
