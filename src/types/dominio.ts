/**
 * Entidades do SalesHub.
 *
 * Vocabulário deliberado: nada aqui se chama "venda", "receita" ou "matrícula
 * confirmada". A fonte é a conversa, e a conversa comprova intenção, não
 * transação. Onde o negócio fala em venda, o tipo fala em *indício de conversão*
 * — e quem quiser transformar isso em receita precisa cruzar com o ERP, que este
 * sistema não acessa.
 */

import type { Classificado } from "./classificacao";

// ------------------------------------------------------------------ cadastros

export interface Unidade {
  readonly id: string;
  readonly nome: string;
}

export interface Equipe {
  readonly id: string;
  readonly nome: string;
  readonly unidadeId: string;
}

export interface Atendente {
  readonly id: string;
  readonly nome: string;
  readonly equipeId: string;
  readonly unidadeId: string;
  readonly ativo: boolean;
}

export interface Curso {
  readonly id: string;
  readonly nome: string;
  readonly modalidade: "presencial" | "online" | "hibrido";
}

export interface Campanha {
  readonly id: string;
  readonly nome: string;
  readonly plataforma: "instagram" | "facebook" | "google" | "organico" | "indicacao";
  readonly anuncio?: string;
}

export type CanalDeOrigem = "whatsapp" | "instagram_direct" | "webchat" | "telefone";

export interface Lead {
  readonly id: string;
  readonly nome: string;
  readonly telefone: string;
  readonly primeiroContatoEm: string;
}

// ------------------------------------------------------------------- funil
//
// Etapas vêm da API, não de um enum: a régua de classificação vai evoluir junto
// com o modelo de análise, e uma mudança de taxonomia não pode exigir deploy do
// frontend. `chave` é estável; rótulo, ordem e cor são configuração.

export interface EtapaDoFunil {
  readonly chave: string;
  readonly rotulo: string;
  readonly ordem: number;
  readonly cor: string;
  readonly descricao: string;
  /** Etapa terminal não avança para nenhuma outra (sem interesse, sem resposta…). */
  readonly terminal: boolean;
}

// -------------------------------------------------------------- classificação

export type Sentimento = "positivo" | "neutro" | "negativo";
export type NivelDeInteresse = "alto" | "medio" | "baixo" | "indefinido";
export type IntencaoDeCompra = "declarada" | "provavel" | "incerta" | "ausente";

export interface Objecao {
  readonly categoria: string;
  readonly descricao: string;
}

export interface ValorMencionado {
  /**
   * Valor CITADO em alguma mensagem. Não é preço praticado, não é receita e não
   * sobrevive à negociação que costuma vir depois. Existe para responder "que
   * faixa de preço aparece nas conversas", nunca "quanto faturamos".
   */
  readonly valor: number;
  readonly contexto: string;
  readonly mencionadoPor: "lead" | "atendente";
}

export interface ProximoPasso {
  readonly descricao: string;
  readonly prazo?: string;
  readonly cumprido: boolean;
}

// ------------------------------------------------------- qualidade do atendimento

export interface CriterioDeQualidade {
  readonly chave: string;
  readonly rotulo: string;
  /** 0 a 100. É leitura da conversa por IA — nunca avaliação formal de pessoa. */
  readonly nota: number;
  readonly observacao?: string;
}

export interface AvaliacaoDeQualidade {
  readonly notaGeral: number;
  readonly criterios: readonly CriterioDeQualidade[];
  readonly pontosFortes: readonly string[];
  readonly oportunidades: readonly string[];
}

// ------------------------------------------------------------------ conversa

export interface MensagemDaConversa {
  readonly id: string;
  readonly autor: "lead" | "atendente" | "bot" | "sistema";
  readonly texto: string;
  readonly enviadaEm: string;
  readonly tipoDeMidia?: "imagem" | "audio" | "video" | "documento";
}

/**
 * Métricas medidas diretamente das mensagens — as únicas que não dependem de IA.
 * Contagem e relógio: ou a mensagem existe ou não existe.
 */
export interface MetricasDaConversa {
  readonly totalDeMensagens: number;
  readonly mensagensDoLead: number;
  readonly mensagensDoAtendente: number;
  readonly tempoAtePrimeiraRespostaSegundos: number | null;
  readonly tempoMedioDeRespostaSegundos: number | null;
  readonly duracaoMinutos: number | null;
  readonly houveRespostaDoAtendente: boolean;
}

/** Análise produzida sobre a transcrição. Tudo aqui é leitura, não registro. */
export interface AnaliseDaConversa {
  /**
   * Qual operação atendeu: `comercial`, `cobranca`, `atendimento_ao_aluno` ou
   * `nao_identificado`. O SZ Chat é compartilhado pelas três áreas, e sem isto o
   * funil comercial contava conversa de cobrança no próprio denominador.
   *
   * Sai da mesma leitura de IA que o resto — por isso é `Classificado`, e por isso
   * a origem é `inferido`. Abaixo da confiança mínima do coletor o valor já chega
   * como `nao_identificado`: preferir uma fatia auditável a contaminar a área.
   */
  readonly departamento: Classificado<string>;
  readonly resumo: Classificado<string>;
  readonly assuntoPrincipal: Classificado<string>;
  readonly cursoDeInteresseId: Classificado<string | null>;
  readonly unidadeDeInteresseId: Classificado<string | null>;
  readonly etapaDoFunil: Classificado<string>;
  readonly nivelDeInteresse: Classificado<NivelDeInteresse>;
  readonly intencaoDeCompra: Classificado<IntencaoDeCompra>;
  readonly sentimento: Classificado<Sentimento>;
  readonly duvidas: Classificado<readonly string[]>;
  readonly objecoes: Classificado<readonly Objecao[]>;
  readonly motivoAparenteDaPerda: Classificado<string | null>;
  readonly concorrentesMencionados: Classificado<readonly string[]>;
  readonly valoresMencionados: Classificado<readonly ValorMencionado[]>;
  readonly descontosMencionados: Classificado<readonly string[]>;
  readonly formasDePagamentoMencionadas: Classificado<readonly string[]>;
  readonly urgenciaDeclarada: Classificado<boolean>;
  readonly prazoPretendidoParaIniciar: Classificado<string | null>;
  readonly proximoPasso: Classificado<ProximoPasso | null>;
  /**
   * Sinal de que o lead disse ter fechado. **Nunca** matrícula confirmada: a
   * origem deste campo é sempre `requer_confirmacao_externa`.
   */
  readonly indicioDeConversao: Classificado<boolean>;
  readonly qualidade: Classificado<AvaliacaoDeQualidade>;
  readonly riscos: Classificado<readonly string[]>;
}

export interface Conversa {
  readonly id: string;
  readonly protocolo: string;
  readonly lead: Lead;
  readonly atendenteId: string | null;
  readonly equipeId: string | null;
  readonly unidadeId: string | null;
  readonly campanhaId: string | null;
  readonly canal: CanalDeOrigem;
  readonly iniciadaEm: string;
  readonly ultimaMensagemEm: string;
  readonly encerradaEm: string | null;
  readonly metricas: MetricasDaConversa;
  readonly analise: AnaliseDaConversa;
}

/** Versão enxuta para listas — evita trafegar transcrição inteira em tabela. */
export interface ConversaResumida {
  readonly id: string;
  readonly protocolo: string;
  readonly leadNome: string;
  readonly atendenteNome: string | null;
  readonly campanhaNome: string | null;
  readonly cursoNome: string | null;
  readonly canal: CanalDeOrigem;
  readonly iniciadaEm: string;
  readonly ultimaMensagemEm: string;
  readonly etapaDoFunil: Classificado<string>;
  readonly intencaoDeCompra: Classificado<IntencaoDeCompra>;
  readonly sentimento: Classificado<Sentimento>;
  readonly totalDeMensagens: number;
  readonly tempoAtePrimeiraRespostaSegundos: number | null;
}

export interface ConversaDetalhada extends Conversa {
  readonly mensagens: readonly MensagemDaConversa[];
}

/** Por que uma conversa foi parar na lista de atenção. */
export type MotivoDeAtencao =
  | "sem_resposta_do_atendente"
  | "lead_abandonou"
  | "proximo_passo_vencido"
  | "objecao_sem_tratamento"
  | "sentimento_negativo";

export interface ConversaComAtencao extends ConversaResumida {
  readonly motivo: MotivoDeAtencao;
  readonly detalheDoMotivo: string;
}

export const ROTULO_MOTIVO_ATENCAO: Record<MotivoDeAtencao, string> = {
  sem_resposta_do_atendente: "Sem resposta do atendente",
  lead_abandonou: "Lead parou de responder",
  proximo_passo_vencido: "Próximo passo vencido",
  objecao_sem_tratamento: "Objeção não tratada",
  sentimento_negativo: "Sentimento negativo",
};

export const ROTULO_CANAL: Record<CanalDeOrigem, string> = {
  whatsapp: "WhatsApp",
  instagram_direct: "Instagram Direct",
  webchat: "Webchat",
  telefone: "Telefone",
};

export const ROTULO_INTENCAO: Record<IntencaoDeCompra, string> = {
  declarada: "Declarada",
  provavel: "Provável",
  incerta: "Incerta",
  ausente: "Ausente",
};

export const ROTULO_SENTIMENTO: Record<Sentimento, string> = {
  positivo: "Positivo",
  neutro: "Neutro",
  negativo: "Negativo",
};

export const ROTULO_INTERESSE: Record<NivelDeInteresse, string> = {
  alto: "Alto",
  medio: "Médio",
  baixo: "Baixo",
  indefinido: "Indefinido",
};
