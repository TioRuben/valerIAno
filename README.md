# Valeriano

Valeriano is a token-gated chatbot built with TanStack Start, TanStack AI, and
shadcn/ui. The application is designed not to persist conversations on the
server.

## Development

Requirements: Node.js and npm. The local llama.cpp server is defined in
`docker-compose.yml`.

1. Merge `.env.example` into your private `.env`; set a private administrator
   password and generate a random SearXNG secret.
2. Start the local inference and search services with
   `docker compose up llamacpp searxng`.
3. Install dependencies with `npm install`.
4. Start the web app with `npm run dev`.

The product requirements are described in [`SPEC.md`](./SPEC.md), with
feature-level behavior and acceptance criteria in [`specs/`](./specs/). Open
questions in those specifications are intentionally unresolved; confirm them
before implementing the affected behavior.

## Project commands

- `npm run dev` — start the development server.
- `npm run build` — build the application.
- `npm run lint` — lint the source.
- `npm run typecheck` — check TypeScript types.
- `npm run check` — check formatting.
