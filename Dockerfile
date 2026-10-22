FROM node:22-bookworm-slim

ENV NODE_ENV=development \
    PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/* \
    && corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build \
    && mkdir -p /app/data \
    && chown -R node:node /app/data

ENV NODE_ENV=production \
    DATABASE_PATH=/app/data/valeriano.sqlite
VOLUME ["/app/data"]
EXPOSE 3000
USER node

# The server runs through Vite's preview server, which serves the production build.
CMD ["pnpm", "exec", "vite", "preview", "--host", "0.0.0.0", "--port", "3000"]
