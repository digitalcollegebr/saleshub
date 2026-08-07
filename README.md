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

Ligar os dados reais é preencher `API_URL` e `SALESHUB_TOKEN` e reiniciar. Não há
interruptor separado, não há rebuild: **se há para onde ligar, liga.** Confira em
`/api/dados/estado`.

| Script              | O que faz             |
| ------------------- | --------------------- |
| `npm run dev`       | desenvolvimento       |
| `npm run build`     | build de produção     |
| `npm run typecheck` | TypeScript sem emitir |
| `npm run lint`      | ESLint                |
| `npm run format`    | Prettier              |

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

> ⚠️ **A imagem não carrega configuração nenhuma — e isso é a decisão.** Variáveis
> `NEXT_PUBLIC_*` são resolvidas em tempo de build: o Next grava o valor literal no
> bundle do navegador. Qualquer configuração com esse prefixo tornaria "ligar os
> dados reais" um rebuild, e um token com esse prefixo seria um token público.
>
> Por isso `API_URL` e `SALESHUB_TOKEN` não têm prefixo: são lidas no servidor, em
> execução. **A mesma imagem serve demonstração e dados reais.**

```bash
API_URL=http://api:8000/saleshub \
SALESHUB_TOKEN=... \
docker compose up -d
```

#### A rede do coletor

O compose entra em duas redes: a do próprio projeto (por onde o Traefik alcança o
container) e a rede `analisa-vendas`, declarada como `external` — é ela que faz
`http://api:8000` resolver, porque `api` é o nome do serviço no compose do coletor.

Esse nome é o mesmo em qualquer máquina porque o compose do coletor o **fixa**
(`networks.default.name`) em vez de deixar o Docker derivá-lo do nome do projeto, que
seria o diretório do clone em desenvolvimento e o UUID do recurso no Coolify. É um
acoplamento entre os dois repositórios, deliberado: paga-se uma linha lá para não ter
que descobrir e configurar um nome de rede em cada ambiente aqui.

Como a rede é externa, o compose **não a cria**. Se ela não existir, `docker compose
up` para na hora com `network ... declared as external, but could not be found` —
melhor que subir e só quebrar na primeira consulta. Para rodar em demonstração sem o
coletor de pé, `REDE_DO_COLETOR=bridge` (a rede padrão do Docker, que sempre existe).

### Deploy no Coolify

Mesmo padrão do `analisa-vendas`: aponte para o `docker-compose.yml` da raiz e
defina o domínio em **Domains for web** — a variável mágica
`SERVICE_FQDN_WEB_3000` já está no compose, e o Coolify cria as labels do Traefik
e emite o certificado. Nenhuma porta é publicada no host em produção; as portas
locais vivem em `docker-compose.override.yml`, que o Coolify ignora.

Em _Environment Variables_, defina `API_URL` e `SALESHUB_TOKEN` — **sem** prefixo
`NEXT_PUBLIC_`. Elas são lidas em execução pelo proxy, não gravadas no bundle:
trocar qualquer uma das duas **não exige rebuild**, só reiniciar o serviço.

Na prática só `SALESHUB_TOKEN` precisa ser definida: `API_URL` já vem com o endereço
interno (`http://api:8000/saleshub`) e a rede do coletor tem nome fixo. Enquanto não
há login, some `PERMITIR_SEM_SESSAO` — leia o aviso abaixo antes.

O FQDN público do coletor **não** funciona como `API_URL` de dentro do container: ele
resolve para o IP público do próprio host e o retorno pelo Traefik (hairpin NAT) não
fecha. O sintoma é o painel carregando eternamente e
`{"erro":"A API de analytics não respondeu."}` — timeout do proxy, não resposta do
coletor. Use o endereço interno.

Mudança de rede exige **redeploy**, não reinício: o container é recriado.

> 🔒 **Não ligue a API real antes da autenticação existir.**
>
> A aplicação ainda não tem login: quem abrir a URL vê o painel. Sem `API_URL` e
> `SALESHUB_TOKEN` isso é inofensivo — são dados de demonstração. No instante em que
> as duas forem preenchidas, um domínio público sem autenticação expõe conversas de
> clientes reais na internet.
>
> A ordem correta é: autenticação → API real. Nunca o contrário. A arquitetura já
> está preparada (`obterUsuarioAtual()`, `podeVer()`, perfis) — falta plugar um
> provedor de identidade.
>
> **O proxy já falha fechado**: mesmo com o coletor configurado, sem
> `PERMITIR_SEM_SESSAO=true` ele responde 401 em **dados reais** — a demonstração
> continua passando, porque dado fictício não é de ninguém e exigir sessão para vê-lo
> deixaria o painel em branco sem proteger nada. É na função `autorizado()`
> (`src/app/api/dados/[...caminho]/route.ts`) que a verificação de sessão entra — um
> lugar só.

O que já está endurecido para o domínio público: `X-Frame-Options: DENY` e
`frame-ancestors 'none'` (clickjacking), `nosniff`, `Referrer-Policy`,
`Permissions-Policy` sem câmera/microfone/localização, `poweredByHeader`
desligado, e `robots.txt` + meta tag bloqueando indexação — vale desde já, porque
URL indexada circula e sair do índice depois dá mais trabalho que nunca entrar.

## Configuração

```bash
# .env.local — vazio, roda em demonstração; preenchido, liga o coletor.
API_URL=https://coletor.digitalgenai.com.br/saleshub
SALESHUB_TOKEN=

# Só desenvolvimento: sem login, o proxy nega DADOS REAIS (a demonstração passa).
PERMITIR_SEM_SESSAO=true
```

Não há variável para "usar mocks": a presença da configuração **é** a escolha. Um
interruptor separado pode ficar em desacordo com o que ele deveria refletir — e um
selo "demonstração" errado sobre dado real ninguém percebe olhando.

### Por que existe um proxy no meio

O navegador **não** fala com a API de analytics. Ele fala com `/api/dados`, uma rota
do próprio Next que roda no servidor, guarda o token e repassa a chamada:

```
navegador ──▶ /api/dados/painel/funil ──▶ coletor/saleshub/painel/funil
              (mesma origem)                (Authorization: Bearer …)
```

O motivo é simples e não tem contorno: **um app de navegador não tem onde guardar
segredo.** Qualquer coisa em `NEXT_PUBLIC_*` é substituída literalmente no bundle —
um token ali é lido no devtools por qualquer visitante, e dá acesso direto às
conversas de clientes reais. O proxy é o menor lugar possível para o segredo morar.

Isto não torna o projeto um backend: não há coleta, banco nem regra de negócio na
rota — ela encaminha leitura, com uma lista fechada de caminhos permitidos
(`src/app/api/dados/[...caminho]/route.ts`). A única exceção é `/usuarios/eu`, que é
respondida localmente: quem sabe quem está logado é quem tem a sessão.

---

## O que a aplicação pode e não pode afirmar

Esta é a decisão de produto mais importante do SalesHub, e ela está codificada nos
tipos (`src/types/classificacao.ts`), não apenas no texto da interface.

| Natureza                           | Exemplos                                                                                                      | Como aparece                                                                              |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Medido** — contado nas mensagens | volume, tempo até 1ª resposta, tempo médio de resposta, duração, nº de mensagens, conversas sem resposta      | selo verde "Medido"; número apresentado sem ressalva                                      |
| **Inferido** — leitura da IA       | etapa do funil, intenção, sentimento, objeções, curso de interesse, motivo de perda, próximo passo, qualidade | selo âmbar "Inferido" + nível de confiança + evidências                                   |
| **Externo** — a conversa não prova | matrícula confirmada, receita, ticket médio, pagamento, ROI                                                   | **não existe na aplicação**; onde a leitura tenderia a isso, um aviso explica o que falta |

### Vocabulário

O termo "venda realizada" **não é usado**. Em seu lugar: _indício de conversão_,
_intenção de compra_, _próximo passo acordado_, _negociação avançada_, _resultado
aparente da conversa_. Isso vale para rótulos de interface, nomes de tipos e nomes
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
`SalesHubApi` (`src/services/contrato.ts`). No navegador quem a satisfaz é sempre
`ApiHttp`, apontando para `/api/dados` — a rota do próprio Next que guarda o token
e escolhe entre o coletor e a demonstração.

Foi essa indireção que permitiu trocar a origem dos dados **sem tocar em uma linha
de tela**: o `ApiMock` saiu do navegador e passou a rodar no servidor, atrás da
mesma porta, e nenhum componente soube.

Para ligar a API real: preencher `API_URL` e `SALESHUB_TOKEN`, reiniciar. Só isso.

### Tipos

O tipo central é `Classificado<T>`:

```ts
interface Classificado<T> {
  valor: T;
  origem: "explicito" | "inferido" | "nao_identificado" | "requer_confirmacao_externa";
  confianca?: "alta" | "media" | "baixa";
  evidencias?: EvidenciaDeClassificacao[]; // trechos que sustentam a conclusão
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

Etapas terminais (_sem interesse_, _sem resposta_, _encerrado_, _inconclusivo_)
ficam **fora da progressão**, num bloco separado. Somá-las ao funil produziria uma
"taxa de conversão" sem significado.

---

## Desenvolvimento contra o coletor real

Sem configuração nenhuma, `npm run dev` já sobe o painel inteiro sobre dados de
demonstração — é um modo de desenvolvimento válido e não exige o coletor no ar.

Para trabalhar contra o [coletor](https://github.com/digitalcollegebrasil/analisa-vendas)
rodando na mesma máquina:

```bash
# no clone do coletor
make up && make seed                                   # 60 conversas classificadas
echo "SALESHUB_TOKEN=$(openssl rand -hex 32)" >> .env
docker compose up -d --force-recreate api

# aqui
cat > .env.local <<EOF
API_URL=http://127.0.0.1:8000/saleshub
SALESHUB_TOKEN=<o mesmo token>
PERMITIR_SEM_SESSAO=true
EOF
npm run dev
```

`http://localhost:3000/api/dados/estado` responde se o coletor foi alcançado e, se
não foi, por quê. Trocar entre os dois modos é editar o `.env.local` e reiniciar o
servidor — nunca rebuild.

> As duas metades do contrato vivem em repositórios diferentes e **nada verifica se
> continuam de acordo**. Ao mexer no formato de qualquer resposta, rode os dois
> juntos e olhe a tela: foi assim que apareceram um ranking duplicando atendente e
> um percentual em escala de fração exibido como "1%". Ver `DECISOES.md`, seção 13.

---

## Evoluindo

A navegação já lista as áreas seguintes (marcadas "em breve") e o controle de
acesso por perfil já funciona (`podeVer()` em `src/types/usuario.ts`).

| Próximo passo               | Onde encostar                                                                                                                       |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Tela de detalhe da conversa | `app/conversas/[id]` — o tipo `ConversaDetalhada` e `obterConversa()` já existem                                                    |
| Visão de marketing          | novo `app/marketing`, agregando por `campanhaId`                                                                                    |
| Autenticação real           | `autorizado()` em `src/app/api/dados/[...caminho]/route.ts` e a rota `/api/dados/usuarios/eu` — dois pontos, nenhum componente muda |
| Configuração das etapas     | as etapas já vêm da API; falta a tela de edição                                                                                     |
| Exportação                  | adicionar método ao contrato e implementar nos dois adaptadores                                                                     |

Não implementado de propósito: integração com CRM/ERP. Quando existir, os campos
`requer_confirmacao_externa` passam a ter uma fonte — e só então indicadores
financeiros podem aparecer.

---

## Decisões técnicas

Registradas em [`DECISOES.md`](./DECISOES.md), com o raciocínio de cada uma.
