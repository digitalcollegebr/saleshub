# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Comandos

```bash
npm run dev          # desenvolvimento (http://localhost:3000 → /funil)
npm run build        # build de produção (output: standalone)
npm run typecheck    # tsc --noEmit
npm run lint         # eslint src   (lint:fix para corrigir)
npm run format       # prettier --write "src/**/*.{ts,tsx,css}"  (format:check verifica)
docker compose up -d --build   # http://127.0.0.1:3000, healthcheck em /api/saude
```

A porta local vem de `docker-compose.override.yml`, que o compose carrega sozinho e o
Coolify ignora (ele passa `-f docker-compose.yml`): em produção nada é publicado no
host, quem alcança o container é o Traefik.

O compose entra em duas redes, e a segunda é **externa**: `analisa-vendas`, onde o
nome `api` resolve — daí `API_URL` já vir com `http://api:8000/saleshub` por padrão.
Aquele nome de rede é fixado no compose do coletor (`networks.default.name`), não
derivado do nome do projeto; mudá-lo lá quebra a subida aqui. A rede não é criada por
este compose: sem ela, `docker compose up` falha na hora. `REDE_DO_COLETOR=bridge`
roda em demonstração sem o coletor de pé. De dentro de container o FQDN público do
coletor não funciona — resolve para o IP do próprio host e o retorno pelo Traefik não
fecha.

Não há suíte de testes nem test runner neste repositório. A verificação antes de
entregar é `npm run typecheck && npm run lint && npm run build`; para mudança de
formato de dado, subir contra o coletor real e **olhar a tela** (ver "Contrato"
abaixo).

Diagnóstico do modo de dados: `http://localhost:3000/api/dados/estado` responde se
o coletor foi alcançado e, quando não foi, por quê.

## O que este projeto é

Frontend Next.js (App Router, React 19, Tailwind v4) de conversation analytics
comercial. Não há coleta, banco nem regra de negócio: tudo vem do coletor externo
(`analisa-vendas`, repositório separado) por HTTP.

Documentação de referência: `README.md` (como rodar, deploy, modelo de dados) e
`DECISOES.md` (13 decisões com o que foi descartado e por quê — leia antes de
propor mudança estrutural; várias "melhorias óbvias" já foram avaliadas e
recusadas ali).

## Regras que não se negociam sem discutir

**Vocabulário.** Não existe `venda`, `receita`, `matrícula confirmada`, `ROI`,
`ticket médio` — nem em rótulo de interface, nem em nome de tipo, nem em nome de
variável. A fonte é conversa, e conversa prova intenção, não transação. Use
_indício de conversão_, _intenção de compra_, _próximo passo acordado_, _valor
mencionado_ (sempre com prefixo `~`). `DECISOES.md` §12.

**Todo dado analítico é `Classificado<T>`** (`src/types/classificacao.ts`): carrega
`origem` (`explicito` | `inferido` | `nao_identificado` |
`requer_confirmacao_externa`), `confianca` e `evidencias`. `<SeloDeOrigem>` lê o
tipo e renderiza — quem escreve a tela não escolhe como rotular. Não introduza um
booleano paralelo de "é inferido".

**Nomes em português.** Tipos, funções, variáveis, rotas e chaves de query string
seguem o vocabulário de quem usa a ferramenta (`Conversa`, `Atendente`,
`EtapaDoFunil`, `obterPainelDoFunil`). Comentários explicam _por quê_, não _o quê_.

**Nada de `NEXT_PUBLIC_*` para configuração de dados.** O Next grava esses valores
literalmente no bundle: um token ali é público e trocar de modo viraria rebuild.
`API_URL` e `SALESHUB_TOKEN` são variáveis de servidor, lidas em execução.

## Arquitetura — o que só se entende lendo vários arquivos

**Uma porta de dados só.** O navegador nunca fala com o coletor. Componente não chama
`api` direto: lê por um hook de `src/hooks/use-dados.ts`, cuja `queryKey` carrega os
filtros (mudou filtro, reconsulta sozinho). O hook chama `api` de
`src/services/index.ts`, que é sempre um `ApiHttp` apontando para `/api/dados` — rota
do próprio Next (`src/app/api/dados/[...caminho]/route.ts`) que guarda o token e
decide o destino:

```
navegador ──▶ /api/dados/painel/funil ──▶ coletor/saleshub/painel/funil
              (mesma origem)                (Authorization: Bearer …)
```

`configuracaoDoColetor()` (`src/services/origem.ts`) resolve o modo: `API_URL` +
`SALESHUB_TOKEN` preenchidas → encaminha para o coletor; vazias → responde com o
`ApiMock` executado **no servidor**. Não existe interruptor "usar mocks"; a
presença da configuração é a escolha. O bundle é idêntico nos dois modos.

**Endpoint novo toca cinco lugares, e o compilador só cobra três.** `SalesHubApi`
(`src/services/contrato.ts`) é a interface que os dois adaptadores implementam —
`DECISOES.md` §4. Na ordem:

1. `src/services/contrato.ts` — assinatura e tipo de retorno
2. `src/services/api-http.ts` — caminho e filtros em snake_case (`comoBusca()`)
3. `src/services/mock/api-mock.ts` — a agregação equivalente sobre as 560 conversas
4. `ROTAS` em `src/app/api/dados/[...caminho]/route.ts` — padrão + `demo`; **lista
   fechada, não prefixo aberto**
5. `app/saleshub/router.py` no coletor — a rota de verdade

Pular o 4 dá 404 na tela sem erro de compilação; pular o 5 só aparece rodando contra
o coletor.

Consequências práticas ao mexer:

- Um filtro tem **três grafias**: a da URL (`use-filtros.ts` — `de`, `ate`,
  `unidade`…), a do tipo `FiltrosDoPainel` (camelCase) e a da API real
  (`comoBusca()` em `api-http.ts` — snake_case), de onde `filtrosDaBusca()` no
  proxy converte de volta para o mock. Campo de filtro novo mexe nos três.
- **Autenticação ainda não existe.** `autorizado()` no proxy é o único gargalo por
  onde ela entra, junto com `/api/dados/usuarios/eu` (rota local, nunca
  encaminhada — a API de analytics autentica um cliente, não uma pessoa). O padrão
  para dados reais é **negar**; `PERMITIR_SEM_SESSAO=true` é só desenvolvimento.
  Demonstração passa sem sessão de propósito: dado fictício não é de ninguém.
  `podeVer()` (`src/types/usuario.ts`) já governa menu e áreas.

**O mock espelha a API real, não a substitui.** `src/services/mock/` gera 560
conversas com PRNG de semente fixa e **agrega de verdade** (filtra, agrupa, calcula
acumulado). Chave, rótulo, formato, classe e explicação dos indicadores reproduzem
`app/saleshub/consultas.py` no coletor; só os valores são fictícios. Ao mudar um
indicador, mude nos dois lados. `DECISOES.md` §5.

**Contrato entre repositórios não é verificado por nada.** Python e TypeScript não
se falam. Ao alterar o formato de qualquer resposta, suba os dois juntos (receita em
"Desenvolvimento contra o coletor real" no `README.md`) e olhe a tela — foi assim
que apareceram um ranking duplicando atendente e um percentual em escala de fração
exibido como "1%". `DECISOES.md` §13.

**404 do coletor quase nunca é URL errada.** `_exigir_token()` em
`app/saleshub/router.py` é fail-closed e responde **404, não 401** — tanto quando
`SALESHUB_TOKEN` está vazio no coletor quanto quando o token não confere, porque rota
desligada não anuncia que existe. Antes de mexer em `API_URL`, peça o
`/openapi.json` do coletor: se ele lista as rotas `/saleshub/*` e mesmo assim vem 404,
o problema é token, não caminho. `API_URL` é a base **com** o prefixo `/saleshub`.

**Funil: `conversas` ≠ `alcancaram`.** `conversas` é quantas estão paradas na etapa
agora (onde agir); `alcancaram` é quantas chegaram pelo menos até ali (soma da etapa
com todas as seguintes). Taxa de avanço é `alcancaram[N] ÷ alcancaram[N-1]` — dividir
foto por foto já produziu "152%". Etapas terminais (`terminal: true`) ficam fora da
progressão, em bloco separado; somá-las produz taxa de conversão sem significado.
`DECISOES.md` §2 e §3.

**Etapas do funil são configuração, não `enum`** — vêm da API com chave estável,
rótulo, ordem, cor e a marca `terminal`. A taxonomia evolui com o modelo de análise
e não pode exigir deploy do frontend.

**Estado dos filtros vive na URL** (`src/hooks/use-filtros.ts`, query string
`?de=…&ate=…&unidade=…&equipe=…&atendente=…&campanha=…&canal=…&curso=…&etapa=…`). O recorte de um painel é um link compartilhável; F5 e
voltar/avançar funcionam. Custo aceito: `useSearchParams` exige limite de `Suspense`
na página.

**Três estados de ausência, não um** (`src/components/dados/estados.tsx`):
`carregando`, `erro` e `vazio` — e "vazio" distingue filtro restritivo demais
(com botão de limpar) de período sem conversas. `ErroDaApi` (`src/services/erros.ts`)
é tipado por categoria (`rede`, `autenticacao`, `permissao`, `servidor`, `formato`)
porque cada uma pede resposta diferente da interface. O `retry` do React Query, em
`src/app/providers.tsx`, consulta `vaieAdiantarTentarDeNovo`: só `rede` e `servidor`
repetem — 401/403 não melhoram com insistência.

## Convenções

- Alias `@/*` → `src/*`.
- Prettier: aspas duplas, ponto e vírgula, `printWidth` 100, plugin do Tailwind
  ordena as classes. Rode `npm run format` antes de fechar.
- Formatação de número, data e duração passa por `src/lib/format.ts` (pt-BR, fuso
  `America/Fortaleza`). Não use `toLocaleString` solto.
- Identidade visual em `src/lib/brand.ts`, com `MARCA.cores` (marca) e
  `MARCA.semantica` (natureza do dado) deliberadamente separados.
- Radix está nas dependências, mas hoje só o Tooltip é usado — ele resolve um
  problema real (abrir no foco por teclado, ser lido por leitor de tela).
  `components/ui/select.tsx` embrulha o `<select>` nativo de propósito, e o
  `components/ui/*` restante é primitiva própria. `DECISOES.md` §8.
