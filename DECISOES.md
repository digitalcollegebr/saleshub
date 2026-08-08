# Decisões técnicas

Cada seção registra o problema, a escolha e — mais importante — o que foi
descartado e por quê.

---

## 1. A distinção fato/inferência é tipo, não convenção

**Problema.** O SalesHub lê conversas, não sistemas transacionais. Quase tudo que
interessa a um gestor — etapa do funil, intenção, motivo de perda — é leitura de
texto por IA. Se a diferença entre "contamos" e "a IA achou" ficasse a cargo de
quem escreve o componente, um esquecimento bastaria para um palpite virar número
oficial numa reunião de diretoria.

**Escolha.** `Classificado<T>` carrega `origem`, `confianca` e `evidencias` junto
com o valor. `<SeloDeOrigem>` lê o tipo e renderiza — o desenvolvedor não escolhe
como rotular.

**Descartado.** Um campo `isInferred: boolean` no componente. Funciona até o dia em
que alguém esquece de passar, e o esquecimento é silencioso.

---

## 2. O funil mede acumulado, não instantâneo

**Problema encontrado durante a implementação.** A primeira versão calculava a taxa
de avanço como `conversas na etapa N ÷ conversas na etapa N-1`. O painel exibiu
**152%**.

Cada conversa está parada em exatamente uma etapa — é uma foto, não uma coorte.
Dividir a foto de uma etapa pela da anterior produz mais de 100% sempre que uma
etapa acumula mais conversas paradas que a anterior. E "152% avançaram" não é um
número estranho, é um número **impossível**: sugere que avançou mais gente do que
existia.

**Escolha.** Duas grandezas separadas no tipo:

- `conversas` — quantas estão paradas ali agora (onde agir);
- `alcancaram` — quantas chegaram **pelo menos** até ali (soma desta etapa com
  todas as seguintes da progressão).

A barra usa `alcancaram`, o que dá ao gráfico a forma decrescente que um funil
precisa ter. A taxa de avanço passou a ser `alcancaram[N] ÷ alcancaram[N-1]`, que
nunca ultrapassa 100%. Resultado real: 424 → 389 → 345 → 278 → 209 → 153 → 104 →
74 → 50 → 21.

**Lição registrada.** Foi um mock realista que expôs isso. Dado de exemplo redondo
(10, 20, 30) teria escondido o erro até a produção.

---

## 3. Barras horizontais, não o funil triangular

**Descartado.** O gráfico de funil clássico (trapézios empilhados).

**Por quê.** Três razões concretas: (a) as etapas terminais — _sem resposta_, _sem
interesse_ — não pertencem à progressão, e um funil desenhado as empurraria para o
fundo como se fossem estágio final, produzindo leitura de "taxa de conversão"
falsa; (b) a taxa de avanço precisa aparecer alinhada entre etapas vizinhas; (c)
são 14 etapas, densidade em que o trapézio vira faixa ilegível.

As etapas de encerramento ficam num bloco separado por um divisor, com rótulo
explícito **"fora da progressão"**.

---

## 4. Camada de serviços com contrato explícito

**Problema.** A API não existe ainda, e o frontend não pode esperar.

**Escolha.** `SalesHubApi` é uma interface. `ApiMock` e `ApiHttp` a implementam;
`services/index.ts` escolhe por variável de ambiente. Nenhum componente conhece
`fetch`.

O `ApiHttp` foi escrito **agora**, mesmo sem uso — para provar que o contrato é
implementável sobre REST e para que a integração não seja escrita sob pressão no
dia D. Os caminhos são uma proposta a ajustar.

**Descartado.** Chamar `fetch` nos hooks com um `if (mock)`. Espalha a decisão por
toda a base e torna a remoção dos mocks uma caça a condicionais.

---

## 5. Mock determinístico com agregação real, espelhando a API

O gerador usa PRNG com semente fixa: o painel é idêntico em toda carga e entre
máquinas. Dado que muda a cada F5 impede comparar telas, discutir um número
específico e revisar layout.

O `ApiMock` **agrega de verdade** — filtra, agrupa, calcula acumulado — em vez de
devolver constantes. É assim que os estados difíceis aparecem antes da API existir:
filtro que zera o resultado, etapa vazia no meio do funil, atendente sem conversa.
Foi também o que revelou a decisão nº 2.

**Acrescentado depois, quando a API real chegou.** O mock emitia oito indicadores
próprios (`total_conversas`, `leads_atendidos`, `abandono`…) e a API real emite
sete — **apenas um nome coincidia**. Ou seja: o painel de demonstração e o painel
real eram produtos diferentes, e ligar os dados reais trocaria a tela por baixo de
quem já havia se acostumado com ela. Ninguém teria percebido antes de virar a chave
em produção.

Hoje o mock reproduz chave, rótulo, formato, classe e explicação da API
(`app/saleshub/consultas.py` no coletor); só os valores são fictícios. É o que dá
sentido à demonstração: se funciona ali, funciona igual com dado real. Ao mudar um
indicador, mude nos dois — está escrito nos dois arquivos.

---

## 6. Estado dos filtros na URL

O estado de um painel é um link. Gestor manda o recorte no WhatsApp e o outro vê a
mesma tela. Voltar/avançar do navegador e F5 funcionam de graça.

**Custo aceito.** `useSearchParams` exige limite de `Suspense` no App Router — a
página tem um, com esqueleto.

---

## 7. Etapas do funil vêm da API

`FunnelStage` não é `enum`. A taxonomia de classificação vai evoluir com o modelo
de análise, e mudança de rótulo, ordem ou cor não pode exigir deploy do frontend.
A `chave` é estável; o resto é configuração.

---

## 8. Select nativo em vez de combobox customizado

O filtro é operado por gestor, com teclado, muitas vezes em reunião. O `<select>`
do sistema traz busca por digitação, rolagem por teclado e comportamento familiar
de graça. Um combobox precisaria reimplementar tudo isso — e o Radix Select, apesar
de excelente, ainda exigiria trabalho de acessibilidade para empatar.

Radix é usado onde ele resolve um problema real: **Tooltip**, que precisa abrir no
foco por teclado e ser lido por leitor de tela.

---

## 9. Marca centralizada, separada da semântica

`src/lib/brand.ts` guarda nome, monograma e cores. Trocar a identidade é editar um
arquivo.

**Separação deliberada:** as cores de marca (`MARCA.cores`) e as cores de
significado (`MARCA.semantica` — explícito, inferido, requer confirmação) são
grupos distintos. Confundi-las faria a interface parecer decorada quando ela está,
na verdade, sinalizando natureza de dado.

---

## 10. Erro tipado por categoria

`ErroDaApi` distingue rede, autenticação, permissão, servidor e formato — porque
cada uma exige resposta diferente da interface. "Tentar novamente" só aparece onde
repetir resolve; o React Query não repete 401/403.

---

## 11. Três estados de ausência, não um

`carregando`, `erro` e `vazio` têm componentes próprios. E "vazio" distingue dois
casos na mensagem: **filtro restritivo demais** (com botão de limpar) e **período
sem conversas**. Para quem decide, são situações diferentes — e nenhuma delas é
"zero".

---

## 12. O que deliberadamente não existe

Nenhum campo, tipo, rótulo ou cálculo de: receita, ticket médio, faturamento,
margem, comissão, matrícula confirmada, pagamento, inadimplência, ROI de campanha.

Não são "funcionalidades pendentes" — são afirmações que a fonte de dados **não
sustenta**. Quando houver integração com o sistema de matrículas e o financeiro, os
campos hoje marcados `requer_confirmacao_externa` ganham uma fonte, e só então
indicadores financeiros podem aparecer.

Onde a leitura natural do gestor tenderia para lá (o funil termina em "indício de
conversão"), há um aviso fixo — **antes** do número, não em rodapé — explicando o
que falta para transformar aquilo em fato.

---

## 13. Dois projetos, dois deploys — costurados por HTTP

**Problema.** O SalesHub e o coletor (`analisa-vendas`) formam um produto só para
quem usa. A pergunta natural é se deveriam ser um repositório e um
`docker-compose` só — um deploy, uma fonte de verdade do contrato, tráfego
interno sem sair para a internet.

**Escolha.** Separados, costurados por HTTP através de um proxy no servidor do
Next (`src/app/api/dados`).

Os dois têm ciclos de vida diferentes, e é isso que decide. O coletor é
infraestrutura: recebe webhook 24/7, roda poller, normaliza, classifica. O painel
é produto: muda toda semana, tem autenticação pela frente, vai iterar muito.
Unificados, um ajuste de gráfico recria `migrate`, `sync` e `enrich` — a parte
volátil passa a ditar o ritmo da parte que precisa de estabilidade.

Pesa também o servidor: os dois rodam no mesmo VPS, que também hospeda o Coolify,
o Postgres e o Metabase. Esse VPS **já derrubou um deploy** por concorrência de
build (cinco builds paralelos disparados por um anchor YAML). Somar o build do
Next ao build da imagem Python no mesmo `docker compose build` aumenta exatamente
a probabilidade da falha que já aconteceu.

**Descartado.** O monorepo. O argumento mais forte a favor dele era eliminar a
divergência de contrato entre Python e TypeScript — e ele não faz isso: coloca as
duas cópias na mesma pasta e entrega _visibilidade_, não garantia. A prova está
neste repositório: os dois lados foram escritos pela mesma pessoa, lendo os tipos
do outro, e ainda assim divergiram em duas coisas que só apareceram ao subir os
dois juntos (ranking duplicando atendente; percentual em escala de fração, que a
tela exibia como "1%" onde eram 95%).

O único ganho real da unificação — tráfego interno, sem hairpin pela internet —
se obtém com uma rede externa compartilhada nos dois `docker-compose`, sem fundir
repositório nenhum.

**Reavaliar se:** o frontend passar a precisar do banco (aí dois donos escrevem no
mesmo schema), ou se os dois passarem a mudar sempre juntos por meses seguidos.

**Custo aceito.** A divergência de contrato continua possível e não é pega por
tipo: Python e TypeScript não se falam. A mitigação é o alinhamento explícito do
mock com a API real (decisão 5) e a rota `/api/dados/estado`, que diz se o coletor
respondeu e por que não.

---

## 14. Departamento é classificação da IA, não campo do SZ Chat

**Decisão.** A área responsável por cada conversa — comercial, cobrança,
atendimento ao aluno — sai da **mesma chamada de IA** que já analisa a conversa, a
partir do conteúdo e da intenção predominante. É um `Classificado<string>` como
qualquer outro campo inferido, com confiança, evidências e justificativa.

**Por quê.** O SZ Chat é compartilhado pelas três operações e não distingue nenhuma
delas em campo estruturado. A tabela `sectors` está vazia em produção
(`/filtros` devolve `equipes: []`) e `attendances.sector_id` aponta para linhas sem
nome, então não existe metadado de equipe para usar como âncora barata. O conteúdo
da conversa é a única fonte disponível — e é, de todo modo, a fonte certa: quem
manda mensagem não escolhe departamento, descreve um problema.

Uma segunda chamada de IA só para classificar dobraria o custo e a latência de um
pipeline que já lê a conversa inteira.

**Descartado — `if comercial else cobrança`.** As áreas vivem em `DEPARTAMENTOS`
(`app/enrich/taxonomia.py`), no mesmo formato de `ETAPAS_DO_FUNIL`: chave, rótulo e
descrição. A descrição é o que vai para o prompt — é ali que estão escritas as duas
confusões caras (parcelamento em negociação é comercial; matrícula futura é
comercial), e acrescentar uma quarta área é acrescentar um item à lista.

**Descartado — confiança como float com corte em 0.70.** O produto inteiro fala
`alta | media | baixa`, e `<SeloDeOrigem>` lê esse vocabulário. Um segundo
vocabulário de confiança só para este campo faria a mesma pergunta ter duas
respostas na mesma tela. O que ficou configurável é o **nível mínimo**
(`DEPARTAMENTO_CONFIANCA_MINIMA`, padrão `media`); abaixo dele o valor já chega como
`nao_identificado`.

**Não identificado é resultado, não falha.** Preferimos uma fatia auditável — a
`departamento_justificativa` diz por que a régua não decidiu — a contaminar o
Analytics de uma área com conversa de outra. Um número errado num painel não tem
cara de errado.

**A virada de chave mora no coletor.** `FILTRAR_COMERCIAL_POR_DEPARTAMENTO` (padrão
**false**) decide se `/funil` passa a contar só o comercial. Fica no coletor porque o
BI lê o mesmo banco: uma flag de frontend faria a planilha e a tela discordarem sem
ninguém saber qual está certa. E fica desligada até o backfill rodar — ligada antes,
ela não filtraria o painel comercial, esvaziaria ele, já que nenhuma conversa antiga
tem departamento.

**Conversa antiga não some.** Toda consulta lê `departamento NULL` como
`nao_identificado` via `coalesce`. `NULL = 'comercial'` é NULL, não falso: sem o
coalesce, ligar a flag apagaria do painel todo o histórico não reclassificado — sem
erro, sem aviso, só um número menor.

**Descartado — a régua comercial nas telas novas.** `/cobranca` e `/atendimento` não
mostram funil de etapas, objeções, próximos passos nem indício de conversão. Não é
que esses números seriam baixos ali: é que medem outra coisa. Uma coluna "indício de
conversão" zerada num painel de cobrança faz a equipe parecer improdutiva numa
métrica que nunca foi dela.

**Custo aceito.** A qualidade da classificação só se conhece medindo. Por isso o
painel de observabilidade ganhou a distribuição por área **antes** de o departamento
reger qualquer número, e o backfill (`cli reclassificar`) é manual e fatiável.
