# Stage 1: Build everything with pnpm
FROM node:20-slim AS builder

RUN corepack enable
WORKDIR /app

# Copy dependency files first (better Docker cache)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile

# Copy source code and build
COPY . .
RUN pnpm run db:generate
RUN pnpm run build

# Create a flat production deployment
RUN mkdir -p /deploy/apps/api /deploy/apps/web && \
    cp -r apps/api/dist /deploy/apps/api/ && \
    cp -r apps/api/prisma /deploy/apps/api/ && \
    cp -r apps/web/dist /deploy/apps/web/

# Generate production package.json (no workspace refs)
RUN node -e " \
  const p = require('./apps/api/package.json'); \
  delete p.dependencies['@ogade/shared']; \
  delete p.devDependencies; \
  delete p.prisma; \
  p.dependencies.prisma = '^5.20.0'; \
  p.scripts = { start: 'node apps/api/dist/main.js' }; \
  require('fs').writeFileSync('/deploy/package.json', JSON.stringify(p, null, 2));"

# Install production-only deps in /deploy
WORKDIR /deploy
RUN npm install --omit=dev && \
    npx prisma generate --schema=apps/api/prisma/schema.prisma && \
    mkdir -p node_modules/@ogade/shared && \
    cp -r /app/packages/shared/dist node_modules/@ogade/shared/ && \
    cp /app/packages/shared/package.json node_modules/@ogade/shared/

# Stage 2: Minimal production image
FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /deploy .

ENV PORT=8080
EXPOSE 8080

CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy --schema=apps/api/prisma/schema.prisma || echo 'Migration failed, starting anyway...'; exec node apps/api/dist/main.js"]
