/**
 * Como um lead aparece numa lista.
 *
 * Dois fatos da operação, e o desenho sai deles:
 *
 * **O telefone é a chave.** É por ele que o time acha a pessoa nos outros
 * sistemas e é por ele que o cadastro fecha. Ele acompanha o nome sempre, e é a
 * identificação inteira quando não há nome.
 *
 * **Nome preenchido diz algo.** Quem chega com nome completo normalmente já teve
 * contrato com a instituição — o cadastro veio de lá, não do WhatsApp. Não é
 * regra e tem exceção, então a interface não afirma "é aluno": ela mostra o nome
 * e deixa a leitura com quem conhece a operação.
 *
 * O nome vem do WhatsApp quando não há cadastro (`vars.name` no payload, que o
 * extractor já lê para `contacts.name`) e pode conter emoji. Fica **como veio** —
 * a plataforma é usada para auditoria, e normalizar texto de origem é o começo de
 * não poder confiar no que está na tela.
 */

import { formatarTelefone } from "@/lib/format";

export function IdentificacaoDoLead({
  nome,
  telefone,
  className,
}: {
  nome: string | null;
  telefone: string | null;
  className?: string;
}) {
  // Sem nome e sem telefone é o caso em que o SZ Chat não mandou nenhum dos
  // dois. Dizer "Sem nome" ao menos não inventa identidade.
  if (!nome && !telefone) {
    return <span className={className}>Sem identificação</span>;
  }

  return (
    <span className={className}>
      {nome ? (
        <>
          <span className="break-words">{nome}</span>
          {telefone && (
            <span className="text-texto-fraco ml-1.5 text-[0.85em] font-normal whitespace-nowrap tabular-nums">
              {formatarTelefone(telefone)}
            </span>
          )}
        </>
      ) : (
        <span className="tabular-nums">{formatarTelefone(telefone!)}</span>
      )}
    </span>
  );
}
