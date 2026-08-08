/**
 * Adaptador de mocks — satisfaz `SalesHubApi` inteiramente em memória.
 *
 * Faz a agregação de verdade (filtra, agrupa, calcula taxa de avanço) em vez de
 * devolver constantes: é assim que os estados difíceis aparecem antes da API real
 * existir — filtro que zera o resultado, etapa vazia no meio do funil, atendente
 * sem conversa no período.
 */

import type { SalesHubApi } from "../contrato";
import type {
  ConversaComAtencao,
  ConversaDetalhada,
  ConversaResumida,
  EtapaDoFunil,
  FiltrosDoPainel,
  Indicador,
  ItemDeDistribuicao,
  LinhaDoRanking,
  MotivoDeAtencao,
  OpcoesDeFiltro,
  OportunidadeEmAberto,
  Pagina,
  Paginacao,
  PainelDoFunil,
  PontoDaSerie,
  UsuarioAutenticado,
} from "@/types";
import { inferido } from "@/types";
import { ErroDaApi } from "../erros";
import {
  ATENDENTES,
  CAMPANHAS,
  CANAIS,
  CURSOS,
  EQUIPES,
  ETAPAS_DO_FUNIL,
  UNIDADES,
} from "./catalogo";
import { CONVERSAS, type ConversaGerada } from "./gerador";

const ATRASO_MS = 320;

function esperar<T>(valor: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(valor), ATRASO_MS));
}

function nomeDoAtendente(id: string | null): string | null {
  return ATENDENTES.find((a) => a.id === id)?.nome ?? null;
}

function nomeDaCampanha(id: string | null): string | null {
  return CAMPANHAS.find((c) => c.id === id)?.nome ?? null;
}

function nomeDoCurso(id: string | null | undefined): string | null {
  return CURSOS.find((c) => c.id === id)?.nome ?? null;
}

function dentroDoPeriodo(conversa: ConversaGerada, filtros: FiltrosDoPainel): boolean {
  const inicio = new Date(filtros.periodoInicio).getTime();
  const fim = new Date(filtros.periodoFim).getTime();
  const quando = new Date(conversa.iniciadaEm).getTime();
  return quando >= inicio && quando <= fim;
}

function aplicarFiltros(filtros: FiltrosDoPainel): ConversaGerada[] {
  return CONVERSAS.filter((c) => {
    if (!dentroDoPeriodo(c, filtros)) return false;
    if (filtros.unidadeId && c.unidadeId !== filtros.unidadeId) return false;
    if (filtros.equipeId && c.equipeId !== filtros.equipeId) return false;
    if (filtros.atendenteId && c.atendenteId !== filtros.atendenteId) return false;
    if (filtros.campanhaId && c.campanhaId !== filtros.campanhaId) return false;
    if (filtros.canal && c.canal !== filtros.canal) return false;
    if (filtros.cursoId && c.analise.cursoDeInteresseId.valor !== filtros.cursoId) return false;
    if (filtros.etapaDoFunil && c.analise.etapaDoFunil.valor !== filtros.etapaDoFunil) return false;
    if (filtros.departamento && c.analise.departamento.valor !== filtros.departamento) return false;
    return true;
  });
}

function media(valores: readonly number[]): number | null {
  const validos = valores.filter((v) => Number.isFinite(v));
  if (!validos.length) return null;
  return validos.reduce((s, v) => s + v, 0) / validos.length;
}

/**
 * Mediana de verdade — a API usa `percentile_cont(0.5)`.
 *
 * O indicador de primeira resposta sempre se chamou "Mediana da 1ª resposta" e o
 * mock calculava a **média**. Num tempo de resposta, a diferença não é sutil: um
 * atendimento esquecido por dois dias desloca a média e não mexe na mediana.
 */
function mediana(valores: readonly number[]): number | null {
  const ordenados = valores.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  if (!ordenados.length) return null;
  const meio = Math.floor(ordenados.length / 2);
  return ordenados.length % 2 ? ordenados[meio] : (ordenados[meio - 1] + ordenados[meio]) / 2;
}

function resumir(c: ConversaGerada): ConversaResumida {
  return {
    id: c.id,
    protocolo: c.protocolo,
    leadNome: c.lead.nome,
    leadTelefone: c.lead.telefone,
    atendenteNome: nomeDoAtendente(c.atendenteId),
    campanhaNome: nomeDaCampanha(c.campanhaId),
    cursoNome: nomeDoCurso(c.analise.cursoDeInteresseId.valor),
    canal: c.canal,
    iniciadaEm: c.iniciadaEm,
    ultimaMensagemEm: c.ultimaMensagemEm,
    etapaDoFunil: c.analise.etapaDoFunil,
    intencaoDeCompra: c.analise.intencaoDeCompra,
    sentimento: c.analise.sentimento,
    totalDeMensagens: c.metricas.totalDeMensagens,
    tempoAtePrimeiraRespostaSegundos: c.metricas.tempoAtePrimeiraRespostaSegundos,
  };
}

/**
 * Os MESMOS sete indicadores que a API real devolve.
 *
 * Chave, rótulo, formato, classe e explicação são cópia fiel de
 * `app/saleshub/consultas.py::painel_do_funil` no coletor. Isso não é preciosismo:
 * o modo de demonstração e o modo real precisam ser **o mesmo produto**, senão
 * ligar os dados reais troca a tela por baixo de quem já se acostumou com ela.
 *
 * A primeira versão daqui tinha oito indicadores próprios (`total_conversas`,
 * `leads_atendidos`, `abandono`…) e só UM deles existia na API. Ninguém teria
 * percebido antes de virar a chave em produção.
 *
 * Ao mudar um indicador, mude nos dois lugares — ou o painel vira dois produtos
 * de novo.
 */
function montarIndicadores(conversas: ConversaGerada[]): Indicador[] {
  const total = conversas.length;
  const comResposta = conversas.filter((c) => c.metricas.houveRespostaDoAtendente);
  const semResposta = total - comResposta.length;

  // Próximo passo combinado e ainda EM ABERTO — a API filtra por `cumprido = false`.
  const proximosPassos = conversas.filter((c) => {
    const passo = c.analise.proximoPasso.valor;
    return passo !== null && !passo.cumprido;
  }).length;

  const comIntencao = conversas.filter((c) =>
    ["declarada", "provavel"].includes(c.analise.intencaoDeCompra.valor),
  ).length;
  const indicios = conversas.filter((c) => c.analise.indicioDeConversao.valor).length;
  const qualidade = media(conversas.map((c) => c.analise.qualidade.valor.notaGeral)) ?? 0;

  return [
    {
      chave: "conversas",
      rotulo: "Conversas no período",
      valor: total,
      formato: "inteiro",
      classe: "medida",
      explicacao: "Atendimentos com pelo menos uma mensagem, contados pela data de início.",
    },
    {
      chave: "primeira_resposta",
      rotulo: "Mediana da 1ª resposta",
      valor: Math.round(
        mediana(
          comResposta
            .map((c) => c.metricas.tempoAtePrimeiraRespostaSegundos)
            .filter((v): v is number => v !== null),
        ) ?? 0,
      ),
      formato: "duracao_segundos",
      classe: "medida",
      explicacao:
        "Tempo entre a primeira mensagem e a primeira resposta do time. Mediana, não média: " +
        "um caso extremo não desloca o número.",
    },
    {
      chave: "sem_resposta",
      rotulo: "Sem resposta do time",
      valor: semResposta,
      formato: "inteiro",
      classe: "medida",
      explicacao: "Conversas em que o time não enviou nenhuma mensagem.",
      filtroDeOrigem: { motivo: "sem_resposta_do_atendente" },
    },
    {
      chave: "com_intencao",
      rotulo: "Com intenção de compra",
      valor: comIntencao,
      formato: "inteiro",
      classe: "inferida",
      explicacao:
        "Leitura da IA: o cliente declarou ou demonstrou querer fechar. " +
        "Não é matrícula nem proposta registrada.",
    },
    {
      chave: "proximos_passos",
      rotulo: "Próximos passos em aberto",
      valor: proximosPassos,
      formato: "inteiro",
      classe: "inferida",
      explicacao: "Combinados na conversa que ainda não aparecem como cumpridos.",
    },
    {
      chave: "indicios",
      rotulo: "Indícios de conversão",
      valor: indicios,
      formato: "inteiro",
      classe: "inferida",
      explicacao:
        "O cliente AFIRMOU ter fechado. Não é matrícula confirmada: só o sistema de " +
        "matrículas confirma, e ele não é lido aqui.",
    },
    {
      chave: "qualidade",
      rotulo: "Qualidade média do atendimento",
      valor: Math.round(qualidade * 10) / 10,
      formato: "decimal",
      classe: "inferida",
      explicacao:
        "Leitura da IA sobre o texto da conversa (0 a 100). Não é avaliação de pessoa " +
        "nem substitui a avaliação formal.",
    },
  ];
}

function montarFunil(conversas: ConversaGerada[]): PainelDoFunil["funil"] {
  const total = conversas.length;
  const porEtapa = new Map<string, number>();
  for (const c of conversas) {
    const chave = c.analise.etapaDoFunil.valor;
    porEtapa.set(chave, (porEtapa.get(chave) ?? 0) + 1);
  }

  const ordenadas = [...ETAPAS_DO_FUNIL].sort((a, b) => a.ordem - b.ordem);
  const progressao = ordenadas.filter((e) => !e.terminal);

  // Uma conversa parada na etapa 7 necessariamente passou pelas etapas 1 a 6.
  // `alcancaram` acumula de trás para frente, o que dá ao funil a forma
  // monotonicamente decrescente que ele precisa ter para ser lido como funil.
  const alcancaramPorChave = new Map<string, number>();
  let acumulado = 0;
  for (let i = progressao.length - 1; i >= 0; i -= 1) {
    acumulado += porEtapa.get(progressao[i].chave) ?? 0;
    alcancaramPorChave.set(progressao[i].chave, acumulado);
  }

  let anterior: number | null = null;

  return ordenadas.map((etapa: EtapaDoFunil) => {
    const conversasNaEtapa = porEtapa.get(etapa.chave) ?? 0;
    const alcancaram = etapa.terminal
      ? conversasNaEtapa
      : (alcancaramPorChave.get(etapa.chave) ?? 0);

    // Etapa terminal não pertence à progressão: comparar "sem interesse" com a
    // etapa anterior produziria um número sem significado.
    const taxaDeAvanco =
      etapa.terminal || anterior === null || anterior === 0 ? null : (alcancaram / anterior) * 100;
    if (!etapa.terminal) anterior = alcancaram;

    return {
      chave: etapa.chave,
      rotulo: etapa.rotulo,
      cor: etapa.cor,
      ordem: etapa.ordem,
      terminal: etapa.terminal,
      descricao: etapa.descricao,
      conversas: conversasNaEtapa,
      alcancaram,
      participacao: total ? (alcancaram / total) * 100 : 0,
      taxaDeAvanco,
      confiancaPredominante: etapa.ordem >= 4 ? ("alta" as const) : ("media" as const),
    };
  });
}

function montarSerie(conversas: ConversaGerada[], filtros: FiltrosDoPainel): PontoDaSerie[] {
  const porDia = new Map<string, PontoDaSerie>();
  const inicio = new Date(filtros.periodoInicio);
  const fim = new Date(filtros.periodoFim);

  for (let d = new Date(inicio); d <= fim; d.setDate(d.getDate() + 1)) {
    const chave = d.toISOString().slice(0, 10);
    porDia.set(chave, { data: chave, conversas: 0, comIndicioDeConversao: 0, comProximoPasso: 0 });
  }

  for (const c of conversas) {
    const chave = c.iniciadaEm.slice(0, 10);
    const ponto = porDia.get(chave);
    if (!ponto) continue;
    porDia.set(chave, {
      data: chave,
      conversas: ponto.conversas + 1,
      comIndicioDeConversao:
        ponto.comIndicioDeConversao + (c.analise.indicioDeConversao.valor ? 1 : 0),
      comProximoPasso: ponto.comProximoPasso + (c.analise.proximoPasso.valor ? 1 : 0),
    });
  }

  return [...porDia.values()].sort((a, b) => a.data.localeCompare(b.data));
}

function distribuir(
  entradas: readonly { chave: string; rotulo: string }[],
  total: number,
  contagem: Map<string, number>,
  origem: ItemDeDistribuicao["origem"],
): ItemDeDistribuicao[] {
  return entradas
    .map((e) => ({
      chave: e.chave,
      rotulo: e.rotulo,
      total: contagem.get(e.chave) ?? 0,
      participacao: total ? ((contagem.get(e.chave) ?? 0) / total) * 100 : 0,
      origem,
    }))
    .filter((i) => i.total > 0)
    .sort((a, b) => b.total - a.total);
}

/**
 * O caminho do lead do SDR até o consultor. Espelha `_repasse` em
 * `app/saleshub/consultas.py`: mesma chave, mesmo rótulo, mesma classe e mesma
 * explicação — só os valores são fictícios.
 */
function montarRepasse(conversas: ConversaGerada[]): PainelDoFunil["repasse"] {
  const total = conversas.length;
  const peloSdr = conversas.filter((c) => c.metricas.houveAtendimentoDoSdr).length;
  const repassadas = conversas.filter((c) => c.metricas.houveRespostaDoAtendente).length;
  const paradas = total - repassadas;
  const semConsultor = conversas.filter(
    (c) => c.metricas.encaminhadaAoConsultor && !c.metricas.houveRespostaDoAtendente,
  ).length;

  const faixas = [
    { chave: "ate_5min", rotulo: "Até 5 min", limite: 300 },
    { chave: "ate_30min", rotulo: "5 a 30 min", limite: 1800 },
    { chave: "ate_2h", rotulo: "30 min a 2 h", limite: 7200 },
    { chave: "ate_24h", rotulo: "2 a 24 h", limite: 86400 },
    { chave: "mais_24h", rotulo: "Mais de 24 h", limite: Infinity },
  ];
  const tempos = conversas
    .map((c) => c.metricas.tempoAtePrimeiraRespostaSegundos)
    .filter((t): t is number => t !== null);
  const contagem = new Map<string, number>();
  for (const t of tempos) {
    const faixa = faixas.find((f) => t <= f.limite) ?? faixas[faixas.length - 1];
    contagem.set(faixa.chave, (contagem.get(faixa.chave) ?? 0) + 1);
  }

  return {
    indicadores: [
      {
        chave: "sdr_atendeu",
        rotulo: "Qualificadas pelo SDR",
        valor: peloSdr,
        formato: "inteiro",
        classe: "medida",
        explicacao:
          "Conversas em que o chatbot de qualificação enviou pelo menos uma mensagem. Não diz se a qualificação foi boa — diz que houve.",
      },
      {
        chave: "repassadas",
        rotulo: "Repassadas ao consultor",
        valor: repassadas,
        formato: "inteiro",
        classe: "medida",
        explicacao:
          "Conversas em que uma PESSOA do time escreveu. É o repasse efetivo: encaminhar sem responder não conta aqui.",
      },
      {
        chave: "taxa_de_repasse",
        rotulo: "Taxa de repasse",
        valor: total ? (repassadas / total) * 100 : 0,
        formato: "percentual",
        classe: "medida",
        explicacao:
          "Fatia das conversas do período que chegaram a um consultor. O denominador é o período inteiro, não só o que o SDR atendeu.",
      },
      {
        chave: "paradas_no_sdr",
        rotulo: "Paradas no SDR",
        valor: paradas,
        formato: "inteiro",
        classe: "medida",
        explicacao:
          "Nenhuma pessoa do time escreveu. O lead falou com o robô e a conversa terminou ali.",
        filtroDeOrigem: { motivo: "sem_resposta_do_atendente" },
      },
      {
        chave: "encaminhadas_sem_consultor",
        rotulo: "Encaminhadas sem resposta",
        valor: semConsultor,
        formato: "inteiro",
        classe: "medida",
        explicacao:
          "A plataforma marcou a conversa como encaminhada ao humano e nenhuma pessoa escreveu. É trabalho parado, não histórico.",
        filtroDeOrigem: { motivo: "sem_resposta_do_atendente" },
      },
    ],
    // Faixa zerada continua na lista, como no coletor: some se lê como inexistente.
    tempoAteOConsultor: faixas.map((f) => ({
      chave: f.chave,
      rotulo: f.rotulo,
      total: contagem.get(f.chave) ?? 0,
      participacao: tempos.length ? ((contagem.get(f.chave) ?? 0) / tempos.length) * 100 : 0,
      origem: "explicito" as const,
    })),
  };
}

function montarRanking(conversas: ConversaGerada[]): LinhaDoRanking[] {
  const porAtendente = new Map<string, ConversaGerada[]>();
  for (const c of conversas) {
    if (!c.atendenteId) continue;
    const lista = porAtendente.get(c.atendenteId) ?? [];
    lista.push(c);
    porAtendente.set(c.atendenteId, lista);
  }

  return [...porAtendente.entries()]
    .map(([atendenteId, lista]) => {
      const atendente = ATENDENTES.find((a) => a.id === atendenteId);
      const equipe = EQUIPES.find((e) => e.id === atendente?.equipeId);
      return {
        atendenteId,
        atendenteNome: atendente?.nome ?? "—",
        equipeNome: equipe?.nome ?? "—",
        conversas: lista.length,
        tempoMedioPrimeiraRespostaSegundos: media(
          lista
            .map((c) => c.metricas.tempoAtePrimeiraRespostaSegundos)
            .filter((v): v is number => v !== null),
        ),
        comProximoPasso: lista.filter((c) => c.analise.proximoPasso.valor !== null).length,
        comIndicioDeConversao: lista.filter((c) => c.analise.indicioDeConversao.valor).length,
        qualidadeMedia: inferido(
          Math.round(media(lista.map((c) => c.analise.qualidade.valor.notaGeral)) ?? 0),
          "media",
          {
            justificativa:
              "Média das notas de qualidade atribuídas pela análise às conversas do período.",
          },
        ),
      };
    })
    .sort((a, b) => b.conversas - a.conversas);
}

function motivoDeAtencao(c: ConversaGerada): { motivo: MotivoDeAtencao; detalhe: string } | null {
  if (!c.metricas.houveRespostaDoAtendente) {
    return {
      motivo: "sem_resposta_do_atendente",
      detalhe: "O lead escreveu e ainda não houve resposta do time.",
    };
  }
  const passo = c.analise.proximoPasso.valor;
  if (passo?.prazo && new Date(passo.prazo).getTime() < Date.now() && !passo.cumprido) {
    return { motivo: "proximo_passo_vencido", detalhe: passo.descricao };
  }
  if (c.analise.sentimento.valor === "negativo") {
    return {
      motivo: "sentimento_negativo",
      detalhe: c.analise.motivoAparenteDaPerda.valor ?? "Sinais de insatisfação na conversa.",
    };
  }
  if (c.analise.etapaDoFunil.valor === "sem_resposta") {
    return { motivo: "lead_abandonou", detalhe: "O lead não respondeu após a última mensagem." };
  }
  if (c.analise.objecoes.valor.length > 0 && c.analise.proximoPasso.valor === null) {
    return {
      motivo: "objecao_sem_tratamento",
      detalhe: c.analise.objecoes.valor[0]?.descricao ?? "Objeção sem encaminhamento.",
    };
  }
  return null;
}

export class ApiMock implements SalesHubApi {
  async obterUsuarioAtual(): Promise<UsuarioAutenticado> {
    return esperar({
      id: "user-demo",
      nome: "Daniel Monteiro",
      email: "daniel.monteiro@digitalcollege.com.br",
      perfil: "diretor" as const,
      unidadesPermitidas: "todas" as const,
    });
  }

  async obterOpcoesDeFiltro(): Promise<OpcoesDeFiltro> {
    return esperar({
      unidades: UNIDADES.map((u) => ({ id: u.id, nome: u.nome })),
      equipes: EQUIPES.map((e) => ({ id: e.id, nome: e.nome, unidadeId: e.unidadeId })),
      atendentes: ATENDENTES.map((a) => ({ id: a.id, nome: a.nome, equipeId: a.equipeId })),
      campanhas: CAMPANHAS.map((c) => ({ id: c.id, nome: c.nome })),
      cursos: CURSOS.map((c) => ({ id: c.id, nome: c.nome })),
      canais: CANAIS.map((c) => ({ id: c.id, nome: c.nome })),
      etapas: ETAPAS_DO_FUNIL.map((e) => ({ id: e.chave, nome: e.rotulo })),
    });
  }

  async obterEtapasDoFunil(): Promise<readonly EtapaDoFunil[]> {
    return esperar(ETAPAS_DO_FUNIL);
  }

  async obterPainelDoFunil(filtros: FiltrosDoPainel): Promise<PainelDoFunil> {
    const conversas = aplicarFiltros(filtros);
    const total = conversas.length;

    const contagemObjecoes = new Map<string, number>();
    const contagemCursos = new Map<string, number>();
    const contagemSentimento = new Map<string, number>();
    for (const c of conversas) {
      for (const o of c.analise.objecoes.valor) {
        contagemObjecoes.set(o.categoria, (contagemObjecoes.get(o.categoria) ?? 0) + 1);
      }
      const curso = c.analise.cursoDeInteresseId.valor;
      if (curso) contagemCursos.set(curso, (contagemCursos.get(curso) ?? 0) + 1);
      const s = c.analise.sentimento.valor;
      contagemSentimento.set(s, (contagemSentimento.get(s) ?? 0) + 1);
    }

    return esperar({
      indicadores: montarIndicadores(conversas),
      repasse: montarRepasse(conversas),
      funil: montarFunil(conversas),
      serieDeVolume: montarSerie(conversas, filtros),
      objecoes: distribuir(
        [
          { chave: "preco", rotulo: "Preço" },
          { chave: "tempo", rotulo: "Disponibilidade" },
          { chave: "distancia", rotulo: "Distância" },
          { chave: "decisao_terceiros", rotulo: "Decisão familiar" },
          { chave: "momento", rotulo: "Momento" },
          { chave: "concorrencia", rotulo: "Concorrência" },
          { chave: "duvida_conteudo", rotulo: "Conteúdo do curso" },
          { chave: "empregabilidade", rotulo: "Empregabilidade" },
        ],
        total,
        contagemObjecoes,
        "inferido",
      ),
      cursos: distribuir(
        CURSOS.map((c) => ({ chave: c.id, rotulo: c.nome })),
        total,
        contagemCursos,
        "inferido",
      ),
      sentimentos: distribuir(
        [
          { chave: "positivo", rotulo: "Positivo" },
          { chave: "neutro", rotulo: "Neutro" },
          { chave: "negativo", rotulo: "Negativo" },
        ],
        total,
        contagemSentimento,
        "inferido",
      ),
      ranking: montarRanking(conversas),
      geradoEm: new Date().toISOString(),
      totalDeConversasNoPeriodo: total,
    });
  }

  async listarConversas(
    filtros: FiltrosDoPainel,
    paginacao: Paginacao,
  ): Promise<Pagina<ConversaResumida>> {
    const todas = aplicarFiltros(filtros).sort(
      (a, b) => new Date(b.ultimaMensagemEm).getTime() - new Date(a.ultimaMensagemEm).getTime(),
    );
    const inicio = (paginacao.pagina - 1) * paginacao.porPagina;
    return esperar({
      itens: todas.slice(inicio, inicio + paginacao.porPagina).map(resumir),
      total: todas.length,
      pagina: paginacao.pagina,
      porPagina: paginacao.porPagina,
    });
  }

  async listarConversasComAtencao(
    filtros: FiltrosDoPainel,
  ): Promise<readonly ConversaComAtencao[]> {
    const itens: ConversaComAtencao[] = [];
    for (const c of aplicarFiltros(filtros)) {
      const motivo = motivoDeAtencao(c);
      if (!motivo) continue;
      itens.push({ ...resumir(c), motivo: motivo.motivo, detalheDoMotivo: motivo.detalhe });
      if (itens.length >= 12) break;
    }
    return esperar(itens);
  }

  async listarOportunidadesEmAberto(
    filtros: FiltrosDoPainel,
  ): Promise<readonly OportunidadeEmAberto[]> {
    const agora = Date.now();
    const itens = aplicarFiltros(filtros)
      .filter((c) => c.analise.proximoPasso.valor && !c.analise.proximoPasso.valor.cumprido)
      .slice(0, 12)
      .map((c) => {
        const passo = c.analise.proximoPasso.valor!;
        return {
          conversaId: c.id,
          leadNome: c.lead.nome,
          leadTelefone: c.lead.telefone,
          atendenteNome: nomeDoAtendente(c.atendenteId),
          cursoNome: nomeDoCurso(c.analise.cursoDeInteresseId.valor),
          proximoPasso: passo.descricao,
          prazo: passo.prazo ?? null,
          diasEmAberto: Math.max(
            0,
            Math.round((agora - new Date(c.ultimaMensagemEm).getTime()) / 86400000),
          ),
          etapaDoFunil:
            ETAPAS_DO_FUNIL.find((e) => e.chave === c.analise.etapaDoFunil.valor)?.rotulo ?? "—",
        };
      })
      .sort((a, b) => b.diasEmAberto - a.diasEmAberto);
    return esperar(itens);
  }

  async obterConversa(id: string): Promise<ConversaDetalhada> {
    const conversa = CONVERSAS.find((c) => c.id === id);
    if (!conversa) {
      throw new ErroDaApi(`Conversa ${id} não encontrada`, "servidor", { status: 404 });
    }
    return esperar(conversa);
  }
}
