#!/bin/sh
set -e

# Aplica migrations pendentes contra o banco configurado em DATABASE_URL.
# Idempotente: se nada para aplicar, sai 0.
echo "[0nutri] Aplicando migrations Prisma…"
node /app/node_modules/prisma/build/index.js migrate deploy

# Roda o comando passado (CMD do Dockerfile = node server.js)
exec "$@"
