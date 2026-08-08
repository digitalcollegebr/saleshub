/**
 * Gerador determinístico do conjunto de demonstração.
 *
 * Determinístico de propósito: com semente fixa, o painel é igual em toda carga e
 * entre máquinas. Dado que muda a cada F5 impede comparar telas, discutir um
 * número específico e revisar um layout — e engana quem está avaliando a
 * ferramenta.
 */

import type {
  AnaliseDaConversa,
  AvaliacaoDeQualidade,
  Conversa,
  IntencaoDeCompra,
  MensagemDaConversa,
  NivelDeInteresse,
  Objecao,
  Sentimento,
} from "@/types";
import { fato, inferido, naoIdentificado } from "@/types";
import {
  ATENDENTES,
  CAMPANHAS,
  CANAIS,
  CURSOS,
  ETAPAS_DO_FUNIL,
  OBJECOES_COMUNS,
} from "./catalogo";

/** PRNG mulberry32: rápido, sem dependência e reprodutível. */
function criarAleatorio(semente: number) {
  let estado = semente >>> 0;
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = Math.imul(estado ^ (estado >>> 15), 1 | estado);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rnd = criarAleatorio(20260805);

function escolher<T>(lista: readonly T[]): T {
  return lista[Math.floor(rnd() * lista.length)];
}

function escolherComPeso<T>(itens: readonly (readonly [T, number])[]): T {
  const total = itens.reduce((soma, [, peso]) => soma + peso, 0);
  let sorteio = rnd() * total;
  for (const [item, peso] of itens) {
    sorteio -= peso;
    if (sorteio <= 0) return item;
  }
  return itens[itens.length - 1][0];
}

function inteiroEntre(min: number, max: number): number {
  return Math.floor(rnd() * (max - min + 1)) + min;
}

const NOMES = [
  "Ana Beatriz Lima",
  "Carlos Eduardo Souza",
  "Fernanda Torres",
  "Gabriel Moreira",
  "Larissa Andrade",
  "Pedro Henrique Melo",
  "Beatriz Gomes",
  "Lucas Ferreira",
  "Amanda Ribeiro",
  "Vinícius Barros",
  "Patrícia Nogueira",
  "Rodrigo Cavalcante",
  "Isabela Martins",
  "Bruno Carvalho",
  "Letícia Duarte",
  "Matheus Pontes",
  "Sofia Bezerra",
  "Daniel Aguiar",
  "Renata Vasconcelos",
  "Felipe Correia",
];

const DUVIDAS = [
  "Qual a carga horária do curso?",
  "O certificado é reconhecido?",
  "Tem aula aos sábados?",
  "Preciso ter conhecimento prévio?",
  "Como funciona o estágio?",
  "Tem laboratório na unidade?",
  "Qual a data de início da próxima turma?",
  "O curso ajuda a conseguir emprego?",
];

const CONCORRENTES = ["Senac", "Unifor", "Estácio", "Alura", "Curso local"];
const FORMAS_PAGAMENTO = ["Boleto em 12x", "Cartão em 18x", "PIX à vista", "Débito recorrente"];

const CRITERIOS_QUALIDADE = [
  { chave: "velocidade", rotulo: "Velocidade da 1ª resposta" },
  { chave: "cordialidade", rotulo: "Cordialidade" },
  { chave: "clareza", rotulo: "Clareza" },
  { chave: "personalizacao", rotulo: "Personalização" },
  { chave: "investigacao", rotulo: "Investigação da necessidade" },
  { chave: "apresentacao", rotulo: "Apresentação do curso" },
  { chave: "objecoes", rotulo: "Tratamento de objeções" },
  { chave: "proximo_passo", rotulo: "Condução ao próximo passo" },
] as const;

const ETAPAS_NAO_TERMINAIS = ETAPAS_DO_FUNIL.filter((e) => !e.terminal);
const ETAPAS_TERMINAIS = ETAPAS_DO_FUNIL.filter((e) => e.terminal);

/**
 * Distribuição de etapas com formato de funil real: muita conversa no topo,
 * poucas no fundo, e uma fatia expressiva morrendo em "sem resposta" — que é o
 * que de fato acontece em atendimento por WhatsApp vindo de campanha.
 */
const PESO_POR_ETAPA: readonly (readonly [string, number])[] = [
  ["nova_conversa", 6],
  ["atendimento_iniciado", 10],
  ["necessidade_identificada", 12],
  ["curso_apresentado", 14],
  ["condicao_apresentada", 12],
  ["objecao_identificada", 9],
  ["negociacao", 7],
  ["intencao_de_compra", 5],
  ["proximo_passo", 5],
  ["indicio_de_conversao", 4],
  ["sem_interesse", 5],
  ["sem_resposta", 14],
  ["encerrado", 4],
  ["inconclusivo", 3],
];

function ordemDaEtapa(chave: string): number {
  return ETAPAS_DO_FUNIL.find((e) => e.chave === chave)?.ordem ?? 1;
}

function montarQualidade(etapaOrdem: number): AvaliacaoDeQualidade {
  const base = 55 + Math.min(etapaOrdem, 10) * 3 + inteiroEntre(-8, 8);
  const criterios = CRITERIOS_QUALIDADE.map((c) => ({
    chave: c.chave,
    rotulo: c.rotulo,
    nota: Math.max(20, Math.min(98, base + inteiroEntre(-14, 14))),
  }));
  const notaGeral = Math.round(criterios.reduce((soma, c) => soma + c.nota, 0) / criterios.length);
  const ordenados = [...criterios].sort((a, b) => b.nota - a.nota);
  return {
    notaGeral,
    criterios,
    pontosFortes: ordenados.slice(0, 2).map((c) => c.rotulo),
    oportunidades: ordenados.slice(-2).map((c) => c.rotulo),
  };
}

function montarMensagens(
  inicio: Date,
  quantidade: number,
  cursoNome: string,
): MensagemDaConversa[] {
  const mensagens: MensagemDaConversa[] = [];
  let instante = inicio.getTime();

  const roteiroLead = [
    `Oi! Vi o anúncio de vocês no Instagram e queria saber sobre o curso de ${cursoNome}.`,
    "Qual o valor?",
    "E tem turma à noite?",
    "Consigo parcelar?",
    "Vou conversar em casa e te retorno.",
  ];
  const roteiroAtendente = [
    "Olá! Tudo bem? Que bom seu interesse 😊 Posso te explicar como funciona.",
    `O ${cursoNome} tem turmas com início no próximo mês.`,
    "Temos condição especial para matrículas desta semana.",
    "Posso reservar sua vaga e te enviar o link da matrícula?",
    "Fico à disposição! Qualquer dúvida é só chamar.",
  ];

  for (let i = 0; i < quantidade; i += 1) {
    const doLead = i % 2 === 0;
    instante += inteiroEntre(40, 900) * 1000;
    mensagens.push({
      id: `m-${instante}-${i}`,
      autor: doLead ? "lead" : "atendente",
      texto: doLead
        ? roteiroLead[Math.min(Math.floor(i / 2), roteiroLead.length - 1)]
        : roteiroAtendente[Math.min(Math.floor(i / 2), roteiroAtendente.length - 1)],
      enviadaEm: new Date(instante).toISOString(),
    });
  }
  return mensagens;
}

function montarAnalise(etapaChave: string, cursoId: string, unidadeId: string): AnaliseDaConversa {
  const ordem = ordemDaEtapa(etapaChave);
  const avancada = ordem >= 6 && ordem <= 10;
  const perdida = ["sem_interesse", "sem_resposta", "encerrado"].includes(etapaChave);
  const inconclusiva = etapaChave === "inconclusivo";

  const confianca = inconclusiva ? "baixa" : ordem >= 4 ? "alta" : "media";

  const objecoes: Objecao[] =
    avancada || perdida
      ? Array.from({ length: inteiroEntre(1, 2) }, () => {
          const o = escolher(OBJECOES_COMUNS);
          return { categoria: o.categoria, descricao: o.descricao };
        })
      : [];

  const intencao: IntencaoDeCompra =
    ordem >= 8 ? "declarada" : ordem >= 6 ? "provavel" : perdida ? "ausente" : "incerta";

  const interesse: NivelDeInteresse =
    ordem >= 8 ? "alto" : ordem >= 5 ? "medio" : perdida ? "baixo" : "indefinido";

  const sentimento: Sentimento =
    etapaChave === "sem_interesse" ? "negativo" : ordem >= 8 ? "positivo" : "neutro";

  const temProximoPasso = ordem === 9 || ordem === 10 || (ordem === 8 && rnd() > 0.4);
  const valorBase = escolher([349, 429, 489, 549, 620]);

  return {
    // O conjunto de demonstração é comercial de ponta a ponta: ele existe para
    // mostrar o painel de vendas sem coletor de pé. Fabricar cobrança e SAC aqui
    // encheria as telas novas de conversa inventada — pior que mostrá-las vazias,
    // porque número fictício com cara de real é o que se leva para a reunião.
    departamento: inferido("comercial", confianca),
    resumo: inferido(
      inconclusiva
        ? "Conversa curta, sem informação suficiente para concluir o interesse do lead."
        : `Lead veio de campanha e demonstrou interesse em ${CURSOS.find((c) => c.id === cursoId)?.nome}. ${
            avancada
              ? "Houve apresentação de condição comercial e tratativa de objeção."
              : "Atendimento em fase inicial de qualificação."
          }`,
      confianca,
    ),
    assuntoPrincipal: inferido("Interesse em curso de tecnologia", confianca),
    cursoDeInteresseId: ordem >= 4 ? inferido(cursoId, confianca) : naoIdentificado(null),
    unidadeDeInteresseId: ordem >= 3 ? inferido(unidadeId, "media") : naoIdentificado(null),
    etapaDoFunil: inferido(etapaChave, confianca, {
      justificativa: ETAPAS_DO_FUNIL.find((e) => e.chave === etapaChave)?.descricao,
    }),
    nivelDeInteresse: inferido(interesse, confianca),
    intencaoDeCompra: inferido(intencao, ordem >= 8 ? "alta" : "media"),
    sentimento: inferido(sentimento, "media"),
    duvidas: inferido(
      Array.from({ length: inteiroEntre(1, 3) }, () => escolher(DUVIDAS)),
      "alta",
    ),
    objecoes: objecoes.length ? inferido(objecoes, "alta") : naoIdentificado([]),
    motivoAparenteDaPerda: perdida
      ? inferido(escolher(OBJECOES_COMUNS).descricao, "media")
      : naoIdentificado(null),
    concorrentesMencionados: rnd() > 0.75 ? fato([escolher(CONCORRENTES)]) : naoIdentificado([]),
    valoresMencionados:
      ordem >= 5
        ? fato([
            {
              valor: valorBase,
              contexto: "Mensalidade citada pelo atendente",
              mencionadoPor: "atendente" as const,
            },
          ])
        : naoIdentificado([]),
    descontosMencionados:
      ordem >= 5 && rnd() > 0.5
        ? fato(["Desconto de matrícula para a semana"])
        : naoIdentificado([]),
    formasDePagamentoMencionadas:
      ordem >= 5 ? fato([escolher(FORMAS_PAGAMENTO)]) : naoIdentificado([]),
    urgenciaDeclarada: ordem >= 8 ? inferido(true, "media") : inferido(false, "baixa"),
    prazoPretendidoParaIniciar:
      ordem >= 6 ? inferido("Próxima turma", "media") : naoIdentificado(null),
    proximoPasso: temProximoPasso
      ? inferido(
          {
            descricao: escolher([
              "Retornar contato na quinta-feira",
              "Enviar link de matrícula",
              "Agendar visita à unidade",
              "Confirmar turma do noturno",
            ]),
            prazo: new Date(Date.now() + inteiroEntre(-3, 6) * 86400000).toISOString(),
            cumprido: false,
          },
          "alta",
        )
      : naoIdentificado(null),
    // Sempre `requer_confirmacao_externa`: a conversa pode indicar, o sistema de
    // matrículas é que confirma — e o SalesHub não fala com ele.
    indicioDeConversao: {
      valor: etapaChave === "indicio_de_conversao",
      origem: "requer_confirmacao_externa",
      confianca: etapaChave === "indicio_de_conversao" ? "media" : "alta",
      justificativa:
        "O lead afirmou ter concluído a matrícula. Confirmação depende do sistema de matrículas.",
    },
    qualidade: inferido(montarQualidade(ordem), ordem >= 4 ? "alta" : "media"),
    riscos:
      avancada && rnd() > 0.6
        ? inferido(["Objeção de preço sem tratamento registrado"], "media")
        : naoIdentificado([]),
  };
}

export interface ConversaGerada extends Conversa {
  readonly mensagens: readonly MensagemDaConversa[];
}

export function gerarConversas(quantidade: number, diasParaTras: number): ConversaGerada[] {
  const agora = Date.now();
  const conversas: ConversaGerada[] = [];

  for (let i = 0; i < quantidade; i += 1) {
    const etapaChave = escolherComPeso(PESO_POR_ETAPA);
    const ordem = ordemDaEtapa(etapaChave);
    const atendente = escolher(ATENDENTES);
    const campanha = escolherComPeso(
      CAMPANHAS.map((c) => [c, c.plataforma === "instagram" ? 5 : 2] as const),
    );
    const curso = escolher(CURSOS);
    const canal = escolherComPeso(CANAIS.map((c) => [c.id, c.id === "whatsapp" ? 8 : 1] as const));

    const diasAtras = rnd() * diasParaTras;
    const inicio = new Date(agora - diasAtras * 86400000 - inteiroEntre(0, 10) * 3600000);

    const semResposta = etapaChave === "nova_conversa";
    const totalMensagens = semResposta ? 1 : inteiroEntre(4, 22);
    const mensagens = montarMensagens(inicio, totalMensagens, curso.nome);
    const ultima = mensagens[mensagens.length - 1];

    const doAtendente = mensagens.filter((m) => m.autor === "atendente").length;
    const primeiraResposta = mensagens.find((m) => m.autor === "atendente");
    const tempoPrimeira = primeiraResposta
      ? Math.round((new Date(primeiraResposta.enviadaEm).getTime() - inicio.getTime()) / 1000)
      : null;

    conversas.push({
      id: `conv-${String(i + 1).padStart(4, "0")}`,
      protocolo: `2026${String(inteiroEntre(10000, 99999))}`,
      lead: {
        id: `lead-${i + 1}`,
        nome: NOMES[i % NOMES.length],
        telefone: `+55 85 9${inteiroEntre(1000, 9999)}-${inteiroEntre(1000, 9999)}`,
        primeiroContatoEm: inicio.toISOString(),
      },
      atendenteId: semResposta ? null : atendente.id,
      equipeId: semResposta ? null : atendente.equipeId,
      unidadeId: atendente.unidadeId,
      campanhaId: campanha.id,
      canal: canal as Conversa["canal"],
      iniciadaEm: inicio.toISOString(),
      ultimaMensagemEm: ultima.enviadaEm,
      encerradaEm: ordem >= 11 ? ultima.enviadaEm : null,
      metricas: {
        totalDeMensagens: mensagens.length,
        mensagensDoLead: mensagens.length - doAtendente,
        mensagensDoAtendente: doAtendente,
        tempoAtePrimeiraRespostaSegundos: tempoPrimeira,
        tempoMedioDeRespostaSegundos: doAtendente ? inteiroEntre(90, 2400) : null,
        duracaoMinutos: Math.round(
          (new Date(ultima.enviadaEm).getTime() - inicio.getTime()) / 60000,
        ),
        houveRespostaDoAtendente: doAtendente > 0,
        // O chatbot de qualificação atende quase tudo antes de repassar — é o
        // desenho do processo, não um acaso do dado fictício.
        houveAtendimentoDoSdr: rnd() > 0.08,
        // Encaminhada é mais do que atendida: parte das que o consultor nunca
        // respondeu já tinha saído do robô. É esse degrau que o bloco de repasse
        // existe para mostrar, e um mock sem ele mostraria o bloco sempre zerado.
        encaminhadaAoConsultor: doAtendente > 0 || rnd() > 0.45,
      },
      analise: montarAnalise(etapaChave, curso.id, atendente.unidadeId),
      mensagens,
    });
  }

  return conversas;
}

/** Conjunto único da sessão — gerado uma vez, compartilhado por todas as telas. */
export const CONVERSAS = gerarConversas(560, 30);

export { ETAPAS_NAO_TERMINAIS, ETAPAS_TERMINAIS };
