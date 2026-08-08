/**
 * Formatação brasileira, num lugar só.
 *
 * Número de painel é lido de relance por quem decide: separador errado ou fuso
 * trocado viram desconfiança no dado inteiro. Todas as datas chegam da API em
 * ISO 8601 com offset e são exibidas no fuso da operação.
 */

const FUSO = "America/Fortaleza";
const LOCALE = "pt-BR";

export const inteiro = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });
export const decimal = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatarInteiro(valor: number): string {
  return inteiro.format(valor);
}

export function formatarDecimal(valor: number): string {
  return decimal.format(valor);
}

export function formatarPercentual(valor: number, casas = 1): string {
  return `${valor.toLocaleString(LOCALE, {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  })}%`;
}

/** Duração legível a partir de segundos. "—" quando não há o que medir. */
export function formatarDuracao(segundos: number | null | undefined): string {
  if (segundos === null || segundos === undefined) return "—";
  if (segundos < 60) return `${Math.round(segundos)} s`;
  const minutos = segundos / 60;
  if (minutos < 60) return `${Math.round(minutos)} min`;
  const horas = Math.floor(minutos / 60);
  const resto = Math.round(minutos % 60);
  return resto ? `${horas} h ${resto} min` : `${horas} h`;
}

export function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString(LOCALE, { timeZone: FUSO });
}

export function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleString(LOCALE, {
    timeZone: FUSO,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatarDiaMes(iso: string): string {
  return new Date(iso).toLocaleDateString(LOCALE, {
    timeZone: FUSO,
    day: "2-digit",
    month: "2-digit",
  });
}

/**
 * Valores citados em conversa. O prefixo "~" é proposital: é o que alguém
 * escreveu numa mensagem, não preço de tabela nem receita.
 */
export function formatarValorMencionado(valor: number): string {
  return `~ ${valor.toLocaleString(LOCALE, {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  })}`;
}

export function formatarPorFormato(
  valor: number | null | undefined,
  formato: "inteiro" | "percentual" | "duracao_segundos" | "decimal",
): string {
  // Travessão, não "0": ausência de medida e medida igual a zero são coisas
  // diferentes, e a tela é o último lugar onde elas podem ser confundidas.
  if (valor === null || valor === undefined) return "—";
  switch (formato) {
    case "percentual":
      return formatarPercentual(valor);
    case "duracao_segundos":
      return formatarDuracao(valor);
    case "decimal":
      return formatarDecimal(valor);
    default:
      return formatarInteiro(valor);
  }
}
