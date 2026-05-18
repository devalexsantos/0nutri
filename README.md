# 0nutri

Sistema web privado e mobile-first para controle pessoal de dieta, ingestão de água, peso e progresso, com suporte a múltiplas personas/workspaces. Pensado para rodar no homelab.

Veja `0nutri-plano-desenvolvimento-mobile.md` para a visão completa do produto.

## Stack

- Next.js 16 (App Router, Turbopack) + TypeScript
- Tailwind v4 + shadcn/ui (base-ui)
- Prisma 7 + PostgreSQL 17 (via driver adapter `@prisma/adapter-pg`)
- React Hook Form + Zod 4
- Recharts, date-fns, lucide-react, sonner
- OpenAI SDK v6 (structured outputs via `responses.parse` + `zodTextFormat`)

## Pré-requisitos

- Node 22+
- Docker (para o Postgres em dev)
- Chave da OpenAI (opcional — sem ela o resto do app continua funcional, só `/ai-diet` exibe um aviso)

## Setup local (dev)

```bash
# 1. instala dependências e gera o client do Prisma
npm install

# 2. configure .env (já existe um exemplo)
cp .env.example .env
# edite OPENAI_API_KEY se quiser usar /ai-diet

# 3. sobe o Postgres em Docker (porta 5434)
npm run db:up

# 4. cria tabelas e popula a persona Alex + dieta completa
npm run db:migrate
npm run db:seed

# 5. roda o app
npm run dev
```

Abra http://localhost:3000 → você cai em `/today` com Alex como persona ativa.

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Next.js em modo dev (turbopack) |
| `npm run build` | Build de produção (output `standalone`) |
| `npm run start` | Roda o build de produção |
| `npm run lint` | ESLint |
| `npm run db:up` / `db:down` | Sobe/desce o Postgres do compose |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:seed` | Repopula com Alex + dieta |
| `npm run db:reset` | Reset destrutivo (cuidado) |
| `npm run db:studio` | Abre o Prisma Studio |

## Rotas (Fase 1)

- `/today` — dashboard do dia (refeição atual, próximas, água, peso)
- `/diet` — visualiza dieta ativa
- `/diet/edit` — editor manual da dieta
- `/ai-diet` — **Montar Dieta com IA** (wizard + OpenAI)
- `/water` — registro detalhado de água
- `/weight` — peso + gráfico de evolução
- `/progress` — visão consolidada
- `/personas` — gerenciar personas (workspaces)
- `/settings` — preferências globais

## Estrutura de pastas

```
prisma/
  schema.prisma          # Prisma 7 (datasource SEM url; vai em prisma.config.ts)
  migrations/
  seed.ts                # Alex + dieta completa
prisma.config.ts         # url + seed via @prisma/config
src/
  app/                   # App Router
  components/{layout,today,water,weight,diet,ai-diet,personas,settings,ui}/
  lib/                   # prisma, persona, meals, water, weight, dates, openai
  server/actions/        # personas, diet, ai-diet, meals, water, weight, settings
  schemas/               # Zod
  generated/prisma/      # gerado pelo `prisma generate` (gitignored)
```

## Fluxo Montar Dieta com IA

1. Persona ativa preenche o perfil em `/ai-diet`.
2. Server Action `generateAiDiet` chama `openai.responses.parse` com `zodTextFormat(aiDietSchema, "diet_plan")`.
3. Output é validado por Zod e persistido em `AiDietGeneration`.
4. Preview editável → "Importar e ativar" converte em `Diet/Meal/MealOption/FoodItem`.

A chave `OPENAI_API_KEY` é usada **apenas no server**. Sem chave, a UI exibe um aviso e mantém o resto do app funcional.

## Roadmap

- **Fase 1 (MVP)** — concluída neste primeiro corte
- **Fase 2** — Próxima ação, score diário, checklist, microinterações, PWA
- **Fase 3** — Progresso analítico, insights, fechamento do dia
- **Fase 4** — Fotos, lista de compras, marmita, favoritos, backup
- **Fase 5** — IA avançada (resumo semanal, substituições, versão econômica)

## Deploy no homelab

Pronto para deploy via Docker. O Dockerfile é multi-stage e a entrypoint aplica migrations Prisma automaticamente antes de iniciar o servidor.

### Primeira subida

```bash
# 1. Copie o template de env e ajuste senhas/porta/chave
cp .env.production.example .env.production

# 2. Edite .env.production com:
#    POSTGRES_PASSWORD (forte!), OPENAI_API_KEY, APP_PORT, DB_PORT

# 3. Build + up
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

O entrypoint roda `prisma migrate deploy` antes de subir o servidor. Migrations pendentes são aplicadas; se nada para aplicar, segue direto.

Acesse `http://<homelab>:<APP_PORT>` — você verá a tela de "Crie sua primeira persona" (banco vazio). Crie sua persona pela UI ou importe um backup JSON pela tela de Configurações.

### Variáveis (.env.production)

| Variável | Descrição | Default |
| --- | --- | --- |
| `APP_PORT` | Porta externa do app (interno é 3000) | 3000 |
| `DB_PORT` | Porta externa do Postgres | 5432 |
| `POSTGRES_PASSWORD` | Senha do Postgres em produção | postgres (TROCAR) |
| `OPENAI_API_KEY` | Chave da OpenAI para `/ai-diet` e `/coach`. Sem a chave o resto do app funciona normal. | vazio |

### Backup do banco

```bash
# Dump completo (rodar no host)
docker exec 0nutri-db pg_dump -U postgres zeronutri > backup-$(date +%F).sql

# Restore
docker exec -i 0nutri-db psql -U postgres zeronutri < backup-2026-05-17.sql
```

Alternativa por persona: tela `/settings` → "Backup e restauração" → exporta JSON estruturado por persona (mais portável que dump SQL).

### Backup do volume de fotos

As fotos de evolução ficam em volume nomeado `zeronutri_zeronutri_uploads`. Para backup:

```bash
docker run --rm -v zeronutri_zeronutri_uploads:/data -v "$PWD":/backup alpine \
  tar czf /backup/uploads-$(date +%F).tar.gz -C /data .
```

### Atualizações

```bash
git pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

A migration é idempotente — só aplica o que está pendente.

### Notas

- Sem autenticação por design — uso privado em rede confiável.
- Imagem ~1.8GB (inclui node_modules completo para o CLI do Prisma rodar migrations no entrypoint).
- O healthcheck do app pinga `/today`. Se a persona ainda não foi criada, a página redireciona — ainda assim retorna 200.
