# Build em três estágios: dependências, compilação e execução.
#
# Separar `deps` da compilação faz o cache do Docker trabalhar a favor: mexer em
# código não reinstala node_modules, que é o passo lento.

FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci


FROM node:24-alpine AS builder
WORKDIR /app

# Nenhum build arg de configuração aqui, e isso é a decisão, não um esquecimento.
#
# Variáveis NEXT_PUBLIC_* seriam resolvidas em tempo de BUILD — o Next as substitui
# literalmente no bundle do navegador —, então qualquer uma delas tornaria "trocar
# de demonstração para dados reais" um rebuild de imagem. Tudo que configura o
# SalesHub (API_URL, SALESHUB_TOKEN) é variável de SERVIDOR, lida em execução pelo
# proxy em src/app/api/dados. Consequência prática: **esta imagem serve os dois
# modos**, e ligar os dados reais é preencher dois campos e reiniciar.
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build


FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    TZ=America/Fortaleza

# tzdata: sem ele a variável TZ não resolve e o log sai em UTC.
# wget já vem no busybox do Alpine e serve ao healthcheck — não precisa de curl.
RUN apk add --no-cache tzdata \
    && addgroup -g 1001 -S nodejs \
    && adduser -u 1001 -S nextjs -G nodejs

# O standalone traz o servidor e só as dependências que ele de fato usa.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:3000/api/saude || exit 1

CMD ["node", "server.js"]
