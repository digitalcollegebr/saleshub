# SalesHub

Conversation Analytics comercial da **Digital College**. Transforma as conversas
entre o time comercial e potenciais alunos — originadas majoritariamente de
campanhas de Instagram e atendidas por WhatsApp — em informação gerencial.

> **A regra que organiza este projeto:** a fonte é a conversa. Conversa comprova
> **intenção**, não transação. Nada aqui é receita, matrícula confirmada ou ROI —
> e a interface diz isso em voz alta, não em nota de rodapé.

```
Campanha (Instagram) → CTA → WhatsApp oficial → plataforma omnichannel
                                                        ↓
                                          coleta e transcrição das conversas
                                                        ↓
                                      análise (IA) → API → ██ SalesHub ██
```

Este repositório é **exclusivamente frontend**. Não contém coleta, transcrição nem
análise: consome tudo por uma API externa.

---

## Rodando

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abre em `http://localhost:3000` e redireciona para `/funil`.

Sem nenhuma configuração adicional a aplicação sobe **inteira sobre dados de
demonstração** — 560 conversas geradas de forma determinística, com distribuição
de funil realista. O selo "Dados de demonstração" no topo deixa isso explícito.

| Script | O que faz |
|---|---|
| `npm run dev` | desenvolvimento |
| `npm run build` | build de produção |
| `npm run typecheck` | TypeScript sem emitir |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

### Com Docker

```bash
docker compose up -d --build     # http://127.0.0.1:3000
docker compose logs -f web
docker compose down
```

A imagem usa `output: "standalone"` do Next e roda como usuário sem privilégio.
O healthcheck bate em `/api/saude`, que responde sem tocar em dependência externa
— ele diz "este processo está servindo", não "a API de analytics está no ar".
Misturar as duas coisas faria o orquestrador reiniciar o frontend por um problema
que reiniciar não resolve.

> ⚠️ **Variáveis `NEXT_PUBLIC_*` são resolvidas no build, não na execução.** O Next
> substitui o valor literalmente no bundle que vai para o navegador. Trocar
> `NEXT_PUBLIC_API_URL` exige **rebuild da imagem** — por isso elas entram como
> `build.args` no compose, não apenas em `environment`. É a pegadinha mais comum
> ao containerizar Next.js.

```bash
NEXT_PUBLIC_USAR_MOCKS=false \
NEXT_PUBLIC_API_URL=https://api.saleshub.digitalcollege.com.br \
docker compose up -d --build
```

### Deploy no Coolify

Mesmo padrão do `analisa-vendas`: aponte para o `docker-compose.yml` da raiz e
defina o domínio em **Domains for web** — a variável mágica
`SERVICE_FQDN_WEB_3000` já está no compose, e o Coolify cria as labels do Traefik
e emite o certificado. Nenhuma porta é publicada no host em produção; as portas
locais vivem em `docker-compose.override.yml`, que o Coolify ignora.

Defina também `NEXT_PUBLIC_USAR_MOCKS` e `NEXT_PUBLIC_API_URL` em *Environment
Variables* — o Coolify as repassa como build args.

> 🔒 **Não ligue a API real antes da autenticação existir.**
>
> A aplicação ainda não tem login: quem abrir a URL vê o painel. Com
> `NEXT_PUBLIC_USAR_MOCKS=true` isso é inofensivo — são dados de demonstração. No
> instante em que apontar para a API real, um domínio público sem autenticação
> expõe conversas de clientes reais na internet.
>
> A ordem correta é: autenticação → API real. Nunca o contrário. A arquitetura já
> está preparada (`obterUsuarioAtual()`, `podeVer()`, perfis) — falta plugar um
> provedor de identidade.

O que já está endurecido para o domínio público: `X-Frame-Options: DENY` e
`frame-ancestors 'none'` (clickjacking), `nosniff`, `Referrer-Policy`,
`Permissions-Policy` sem câmera/microfone/localização, `poweredByHeader`
desligado, e `robots.txt` + meta tag bloqueando indexação — vale desde já, porque
URL indexada circula e sair do índice depois dá mais trabalho que nunca entrar.

## Configuração

```bash
# .env.local
NEXT_PUBLIC_USAR_MOCKS=true                                   # false liga a API real
NEXT_PUBLIC_API_URL=https://api.saleshub.digitalcollege.com.br
```

Trocar `NEXT_PUBLIC_USAR_MOCKS` para `false` é **a única mudança necessária** para
ligar a API real. Nenhum componente é alterado — ver "Camada de serviços" abaixo.

---

## O que a aplicação pode e não pode afirmar

Esta é a decisão de produto mais importante do SalesHub, e ela está codificada nos
tipos (`src/types/classificacao.ts`), não apenas no texto da interface.

| Natureza | Exemplos | Como aparece |
|---|---|---|
| **Medido** — contado nas mensagens | volume, tempo até 1ª resposta, tempo médio de resposta, duração, nº de mensagens, conversas sem resposta | selo verde "Medido"; número apresentado sem ressalva |
| **Inferido** — leitura da IA | etapa do funil, intenção, sentimento, objeções, curso de interesse, motivo de perda, próximo passo, qualidade | selo âmbar "Inferido" + nível de confiança + evidências |
| **Externo** — a conversa não prova | matrícula confirmada, receita, ticket médio, pagamento, ROI | **não existe na aplicação**; onde a leitura tenderia a isso, um aviso explica o que falta |

### Vocabulário

O termo "venda realizada" **não é usado**. Em seu lugar: *indício de conversão*,
*intenção de compra*, *próximo passo acordado*, *negociação avançada*, *resultado
aparente da conversa*. Isso vale para rótulos de interface, nomes de tipos e nomes
de variáveis — não há `vendas` nem `receita` em lugar nenhum do código.

Valores citados em mensagens aparecem como **valores mencionados**, sempre com
prefixo `~` e sempre a um clique da conversa de origem. Uma conversa pode conter
negociação, desconto e mudança de condição; o número citado não sobrevive a isso.

---

## Arquitetura

```
src/
├── app/                        rotas (App Router)
│   ├── layout.tsx              shell + providers
│   ├── page.tsx                → /funil
│   ├── providers.tsx           React Query + Tooltip
│   └── funil/page.tsx          painel principal
├── components/
│   ├── layout/app-shell.tsx    barra lateral, topo, perfil
│   ├── filtros/                barra de filtros (URL como estado)
│   ├── dados/                  selo-origem, cartão-indicador, estados
│   ├── funil/                  funil, gráficos, listas acionáveis
│   └── ui/                     primitivas (card, badge, select, tooltip, skeleton)
├── hooks/                      use-filtros, use-dados
├── lib/                        brand (identidade), format (pt-BR), utils
├── services/
│   ├── contrato.ts             ← a interface que a aplicação enxerga
│   ├── api-http.ts             adaptador REST (destino)
│   ├── mock/                   adaptador de demonstração
│   ├── erros.ts                erro tipado por categoria
│   ├── http.ts                 cliente com timeout
│   └── index.ts                escolhe o adaptador por env
└── types/                      classificacao, dominio, metricas, filtros, usuario
```

### Camada de serviços

Nenhum componente conhece `fetch`, URL ou formato de resposta. Todos falam com
`SalesHubApi` (`src/services/contrato.ts`), satisfeita hoje por `ApiMock` e amanhã
por `ApiHttp`. O `ApiHttp` **já existe** — não para ser usado agora, mas para
provar que o contrato é implementável sobre REST e para que a integração não seja
escrita sob pressão no dia em que a API ficar pronta.

Para ligar a API real:

1. `NEXT_PUBLIC_USAR_MOCKS=false` e `NEXT_PUBLIC_API_URL=...`
2. Ajustar os caminhos em `src/services/api-http.ts` conforme a API definir
3. Pronto — nenhum componente muda

### Tipos

O tipo central é `Classificado<T>`:

```ts
interface Classificado<T> {
  valor: T;
  origem: "explicito" | "inferido" | "nao_identificado" | "requer_confirmacao_externa";
  confianca?: "alta" | "media" | "baixa";
  evidencias?: EvidenciaDeClassificacao[];   // trechos que sustentam a conclusão
  justificativa?: string;
}
```

Todo dado analítico trafega assim. `<SeloDeOrigem>` renderiza a origem
automaticamente — quem escreve a tela não escolhe como rotular, obedece ao tipo.
É o que impede que uma inferência vire fato por esquecimento.

### Estado na URL

Os filtros vivem na query string (`?de=…&unidade=…&etapa=…`). O estado de um painel
é um link: um gestor manda o recorte para outro e ambos veem a mesma tela.
Voltar/avançar do navegador e F5 funcionam de graça.

---

## Modelo de dados

`Conversation` · `Lead` · `Agent` · `Team` · `Unit` · `Campaign` · `Channel` ·
`Course` · `ConversationMessage` · `ConversationSummary` · `FunnelStage` ·
`Objection` · `Intent` · `Sentiment` · `FollowUp` · `ConversationOutcome` ·
`QualityScore` · `Classification` · `ClassificationEvidence` · `ConfidenceLevel`

Nomeados em português em `src/types/dominio.ts` (`Conversa`, `Atendente`,
`EtapaDoFunil`…) para casar com o vocabulário de quem usa a ferramenta.

### Etapas do funil

São **configuração**, não `enum`: vêm da API com chave estável, rótulo, ordem, cor
e a marca `terminal`. A taxonomia de classificação vai evoluir com o modelo de
análise, e isso não pode exigir deploy do frontend.

Etapas terminais (*sem interesse*, *sem resposta*, *encerrado*, *inconclusivo*)
ficam **fora da progressão**, num bloco separado. Somá-las ao funil produziria uma
"taxa de conversão" sem significado.

---

## Evoluindo

A navegação já lista as áreas seguintes (marcadas "em breve") e o controle de
acesso por perfil já funciona (`podeVer()` em `src/types/usuario.ts`).

| Próximo passo | Onde encostar |
|---|---|
| Tela de detalhe da conversa | `app/conversas/[id]` — o tipo `ConversaDetalhada` e `obterConversa()` já existem |
| Visão de marketing | novo `app/marketing`, agregando por `campanhaId` |
| Autenticação real | trocar `obterUsuarioAtual()` por sessão; `AppShell` e `podeVer()` já consomem o perfil |
| Configuração das etapas | as etapas já vêm da API; falta a tela de edição |
| Exportação | adicionar método ao contrato e implementar nos dois adaptadores |

Não implementado de propósito: integração com CRM/ERP. Quando existir, os campos
`requer_confirmacao_externa` passam a ter uma fonte — e só então indicadores
financeiros podem aparecer.

---

## Decisões técnicas

Registradas em [`DECISOES.md`](./DECISOES.md), com o raciocínio de cada uma.
