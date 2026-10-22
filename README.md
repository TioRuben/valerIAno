# Valeriano

Valeriano is a token-gated chatbot built with TanStack Start, TanStack AI, and
shadcn/ui. Conversations live only in the browser; the server never stores them.
It uses a local llama.cpp model (OpenAI-compatible endpoint) and a SearXNG
instance for web search. The UI is entirely in Spanish.

The product requirements are in [`SPEC.md`](./SPEC.md), with feature-level
behavior in [`specs/`](./specs/). Open questions there are intentionally
unresolved; confirm them before implementing the affected behavior.

## Requirements

- Node.js 22+ and [pnpm](https://pnpm.io) 10 (for local development).
- Docker with Docker Compose (for the inference/search services, or to run
  everything in containers). The default llama.cpp service uses an NVIDIA GPU
  (`server-cuda`); adjust `docker-compose.yml` if you have none.
- A GGUF model at `models/Gemma-4-E4B-Abliterated.Q4_K_M.gguf` (not committed).

## Configuration

Copy `.env.example` to `.env` (never commit it) and set:

| Variable              | Description                                                                                                          |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `ADMIN_PASSWORD_HASH` | bcrypt hash of the admin password. Generate with `pnpm hash-password <password>`. Escape each `$` as `\$` in `.env`. |
| `JWT_SECRET`          | Random string, at least 32 characters.                                                                               |
| `APP_URL`             | Public URL of the app (optional).                                                                                    |
| `TRUST_PROXY`         | `true` when behind a reverse proxy that sets `X-Forwarded-For`.                                                      |
| `LLAMA_CPP_BASE_URL`  | llama.cpp OpenAI-compatible endpoint (default `http://127.0.0.1:8080/v1`).                                           |
| `DATABASE_PATH`       | SQLite file path (default `./data/valeriano.sqlite`).                                                                |
| `SEARXNG_SECRET`      | Random secret for SearXNG.                                                                                           |
| `SEARXNG_URL`         | SearXNG base URL (default `http://127.0.0.1:8888`).                                                                  |

## Run with pnpm

1. `pnpm install`
2. Start the inference and search services: `docker compose up llamacpp searxng`
3. Start the app: `pnpm dev` (http://localhost:3000)

For a production build: `pnpm build` then `pnpm preview`.

## Run with Docker

Everything in containers (app + llama.cpp + SearXNG), using the published image:

```sh
docker compose --profile app up -d
```

Compose overrides `LLAMA_CPP_BASE_URL`, `SEARXNG_URL` and `DATABASE_PATH` for
the container network; the SQLite database is persisted in `./data`. To build
the image locally instead: `docker compose --profile app up -d --build`.

Run only the app image against services you already host:

```sh
docker run -p 3000:3000 --env-file .env -v ./data:/app/data \
  ghcr.io/tioruben/valeriano:latest
```

Note: in production mode cookies are marked `Secure`, so serve the app over
HTTPS (e.g. behind a reverse proxy) or access it via `localhost`.

## CI / container image

[`.github/workflows/docker.yml`](./.github/workflows/docker.yml) runs
typecheck, lint, tests and build on every push and pull request to `main`.
On pushes to `main` and `v*` tags it also builds the [`Dockerfile`](./Dockerfile)
and publishes the image to the GitHub Container Registry
(`ghcr.io/tioruben/valeriano`) tagged `latest`, branch, version and commit SHA.
Pull requests build the image without pushing. If the package is private, run
`docker login ghcr.io` with a token that has `read:packages` before pulling.

## Project commands

- `pnpm dev` — start the development server.
- `pnpm build` — build the application.
- `pnpm preview` — serve the production build.
- `pnpm test` — run unit tests.
- `pnpm lint` — lint the source.
- `pnpm typecheck` — check TypeScript types.
- `pnpm check` — check formatting.
- `pnpm hash-password <password>` — generate the admin password hash.
