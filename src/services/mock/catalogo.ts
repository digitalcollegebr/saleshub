/**
 * Cadastros de demonstração.
 *
 * Realismo aqui não é enfeite: números redondos e nomes genéricos escondem os
 * problemas de layout que aparecem com "Desenvolvimento Full Stack com IA" numa
 * célula estreita, e escondem a sensação de volume que valida se o painel é
 * legível com dado de verdade.
 */

import type { Atendente, Campanha, Curso, Equipe, EtapaDoFunil, Unidade } from "@/types";
import { MARCA } from "@/lib/brand";

export const UNIDADES: readonly Unidade[] = [
  { id: "u-aldeota", nome: "Aldeota" },
  { id: "u-bezerra", nome: "Bezerra de Menezes" },
  { id: "u-online", nome: "Online" },
];

export const EQUIPES: readonly Equipe[] = [
  { id: "e-comercial-a", nome: "Comercial A", unidadeId: "u-aldeota" },
  { id: "e-comercial-b", nome: "Comercial B", unidadeId: "u-bezerra" },
  { id: "e-digital", nome: "Comercial Digital", unidadeId: "u-online" },
];

export const ATENDENTES: readonly Atendente[] = [
  {
    id: "a-1",
    nome: "Mariana Alves",
    equipeId: "e-comercial-a",
    unidadeId: "u-aldeota",
    ativo: true,
  },
  {
    id: "a-2",
    nome: "Rafael Nunes",
    equipeId: "e-comercial-a",
    unidadeId: "u-aldeota",
    ativo: true,
  },
  {
    id: "a-3",
    nome: "Juliana Castro",
    equipeId: "e-comercial-b",
    unidadeId: "u-bezerra",
    ativo: true,
  },
  {
    id: "a-4",
    nome: "Diego Farias",
    equipeId: "e-comercial-b",
    unidadeId: "u-bezerra",
    ativo: true,
  },
  { id: "a-5", nome: "Camila Rocha", equipeId: "e-digital", unidadeId: "u-online", ativo: true },
  { id: "a-6", nome: "Thiago Menezes", equipeId: "e-digital", unidadeId: "u-online", ativo: true },
];

export const CURSOS: readonly Curso[] = [
  { id: "c-dados", nome: "Análise de Dados", modalidade: "hibrido" },
  { id: "c-fullstack", nome: "Desenvolvimento Full Stack", modalidade: "presencial" },
  { id: "c-ia", nome: "Inteligência Artificial Aplicada", modalidade: "online" },
  { id: "c-ux", nome: "UX/UI Design", modalidade: "hibrido" },
  { id: "c-seguranca", nome: "Segurança da Informação", modalidade: "presencial" },
  { id: "c-marketing", nome: "Marketing Digital", modalidade: "online" },
];

export const CAMPANHAS: readonly Campanha[] = [
  {
    id: "cp-reels-dados",
    nome: "Reels · Análise de Dados",
    plataforma: "instagram",
    anuncio: "reels-dados-01",
  },
  {
    id: "cp-stories-ia",
    nome: "Stories · IA Aplicada",
    plataforma: "instagram",
    anuncio: "stories-ia-03",
  },
  {
    id: "cp-feed-fullstack",
    nome: "Feed · Full Stack",
    plataforma: "instagram",
    anuncio: "feed-fs-02",
  },
  { id: "cp-turma-noturna", nome: "Turma Noturna 2026.2", plataforma: "facebook" },
  { id: "cp-busca-cursos", nome: "Busca · Cursos de Tecnologia", plataforma: "google" },
  { id: "cp-organico", nome: "Orgânico / Direto", plataforma: "organico" },
  { id: "cp-indicacao", nome: "Indicação de aluno", plataforma: "indicacao" },
];

/**
 * Etapas do funil **conversacional** — inferidas do conteúdo, não do CRM.
 *
 * Repare que não há "venda realizada": a última etapa não-terminal é "indício de
 * conversão", e ela existe justamente para não afirmar o que a conversa não prova.
 */
export const ETAPAS_DO_FUNIL: readonly EtapaDoFunil[] = [
  {
    chave: "nova_conversa",
    rotulo: "Nova conversa",
    ordem: 1,
    cor: MARCA.serie[5],
    descricao: "Lead chegou e ainda não houve interação do time.",
    terminal: false,
  },
  {
    chave: "atendimento_iniciado",
    rotulo: "Atendimento iniciado",
    ordem: 2,
    cor: MARCA.serie[0],
    descricao: "Atendente respondeu e a conversa está em curso.",
    terminal: false,
  },
  {
    chave: "necessidade_identificada",
    rotulo: "Necessidade identificada",
    ordem: 3,
    cor: MARCA.serie[0],
    descricao: "O atendente entendeu objetivo, contexto ou momento do lead.",
    terminal: false,
  },
  {
    chave: "curso_apresentado",
    rotulo: "Curso apresentado",
    ordem: 4,
    cor: MARCA.serie[1],
    descricao: "Um curso ou produto específico foi apresentado ao lead.",
    terminal: false,
  },
  {
    chave: "condicao_apresentada",
    rotulo: "Condição comercial apresentada",
    ordem: 5,
    cor: MARCA.serie[1],
    descricao: "Valor, desconto ou forma de pagamento foi mencionado na conversa.",
    terminal: false,
  },
  {
    chave: "objecao_identificada",
    rotulo: "Objeção identificada",
    ordem: 6,
    cor: MARCA.serie[3],
    descricao: "O lead levantou uma resistência — preço, tempo, distância, dúvida.",
    terminal: false,
  },
  {
    chave: "negociacao",
    rotulo: "Negociação em andamento",
    ordem: 7,
    cor: MARCA.serie[3],
    descricao: "Há troca ativa sobre condições, turma ou início.",
    terminal: false,
  },
  {
    chave: "intencao_de_compra",
    rotulo: "Intenção de compra",
    ordem: 8,
    cor: MARCA.serie[2],
    descricao: "O lead declarou que pretende fechar.",
    terminal: false,
  },
  {
    chave: "proximo_passo",
    rotulo: "Próximo passo combinado",
    ordem: 9,
    cor: MARCA.serie[2],
    descricao: "Ficou acordado um retorno, visita, envio de contrato ou matrícula.",
    terminal: false,
  },
  {
    chave: "indicio_de_conversao",
    rotulo: "Indício de conversão",
    ordem: 10,
    cor: MARCA.serie[6],
    descricao:
      "O lead afirmou ter concluído. Depende de confirmação no sistema de matrículas — o SalesHub não vê essa etapa.",
    terminal: false,
  },
  {
    chave: "sem_interesse",
    rotulo: "Sem interesse",
    ordem: 11,
    cor: MARCA.semantica.naoIdentificado,
    descricao: "O lead disse que não tem interesse no momento.",
    terminal: true,
  },
  {
    chave: "sem_resposta",
    rotulo: "Sem resposta do lead",
    ordem: 12,
    cor: MARCA.semantica.naoIdentificado,
    descricao: "O time respondeu e o lead não voltou.",
    terminal: true,
  },
  {
    chave: "encerrado",
    rotulo: "Atendimento encerrado",
    ordem: 13,
    cor: MARCA.semantica.naoIdentificado,
    descricao: "Conversa finalizada sem sinal claro de continuidade.",
    terminal: true,
  },
  {
    chave: "inconclusivo",
    rotulo: "Resultado inconclusivo",
    ordem: 14,
    cor: MARCA.semantica.naoIdentificado,
    descricao: "A conversa não oferece base para classificar com segurança.",
    terminal: true,
  },
];

export const CANAIS = [
  { id: "whatsapp", nome: "WhatsApp" },
  { id: "instagram_direct", nome: "Instagram Direct" },
  { id: "webchat", nome: "Webchat" },
  { id: "telefone", nome: "Telefone" },
] as const;

export const OBJECOES_COMUNS = [
  { categoria: "preco", descricao: "Valor acima do que planejava investir" },
  { categoria: "tempo", descricao: "Sem disponibilidade de horário" },
  { categoria: "distancia", descricao: "Unidade longe de casa ou do trabalho" },
  { categoria: "decisao_terceiros", descricao: "Precisa conversar com a família" },
  { categoria: "momento", descricao: "Quer começar em outro semestre" },
  { categoria: "concorrencia", descricao: "Comparando com outra instituição" },
  { categoria: "duvida_conteudo", descricao: "Dúvida se o curso atende ao objetivo" },
  { categoria: "empregabilidade", descricao: "Dúvida sobre inserção no mercado" },
] as const;
