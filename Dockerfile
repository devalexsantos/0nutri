# syntax=docker/dockerfile:1.7
# 0nutri — build multi-stage. Aproveita o output: 'standalone' do Next.js.

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat

# ----- deps -----
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# postinstall do package.json chama `prisma generate`. O schema precisa estar disponível.
COPY prisma ./prisma
RUN npm ci --no-audit --no-fund

# ----- builder -----
FROM base AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# Prisma 7 lê DATABASE_URL no carregamento de prisma.config.ts mesmo durante `generate`.
# Como nada conecta no banco em build, um placeholder basta.
ENV DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/src ./src
COPY . .
RUN npx prisma generate
RUN npm run build

# ----- runner -----
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Usuário não-root
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Diretório de uploads (montado como volume em produção)
RUN mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app/public/uploads

# Standalone do Next.js (inclui server.js e node_modules tracked)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Sobrepõe node_modules com o conjunto completo (necessário para prisma CLI
# resolver transitivas como 'effect', 'graphmatch', etc).
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Prisma: schema, migrations e client gerado
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/src/generated ./src/generated

# entrypoint roda migrations antes de iniciar
COPY --chown=nextjs:nodejs docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER nextjs

EXPOSE 3000
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "server.js"]
