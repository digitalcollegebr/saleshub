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

**Por quê.** Três razões concretas: (a) as etapas terminais — *sem resposta*, *sem
interesse* — não pertencem à progressão, e um funil desenhado as empurraria para o
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

## 5. Mock determinístico com agregação real

O gerador usa PRNG com semente fixa: o painel é idêntico em toda carga e entre
máquinas. Dado que muda a cada F5 impede comparar telas, discutir um número
específico e revisar layout.

O `ApiMock` **agrega de verdade** — filtra, agrupa, calcula acumulado — em vez de
devolver constantes. É assim que os estados difíceis aparecem antes da API existir:
filtro que zera o resultado, etapa vazia no meio do funil, atendente sem conversa.
Foi também o que revelou a decisão nº 2.

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
