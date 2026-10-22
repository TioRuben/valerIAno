# Working on Valeriano

- The entire application is in Spanish. Write all user-visible text in Spanish,
  including page copy, buttons, labels, placeholders, accessibility names,
  errors, validation messages, notifications, and metadata. Use `es-ES` for
  locale-sensitive dates and numbers. Internal identifiers, code comments,
  logs, and technical documentation may remain in English.
- Read `SPEC.md` before changing product behavior. Treat its open questions as
  unresolved; do not silently make product decisions.
- Keep server-side conversation storage out of scope. Chat messages belong in
  the browser only; server logs must not contain tokens, prompts, or message
  contents.
- Use TanStack Start and TanStack AI for the application and AI integration.
  Connect local inference through the OpenAI-compatible llama.cpp endpoint.
- The only model tools are web search, date/time, and sandboxed code execution.
  Do not expose arbitrary server functions as model tools.
- Keep prompts and request context compact for the configured 8K model context.
- Follow spec-driven work: update or add a focused spec in `specs/` before
  implementing a substantial feature, then add tests and keep the spec in sync.
- Never commit `.env`, database files, model weights, or generated secrets.
- Run the smallest relevant checks after each change; use
  `pnpm typecheck` and `pnpm test` as appropriate.
- Before finishing any requirement, you must run `pnpm lint` and `pnpm build`
  and fix every error and warning they report. Do not report a requirement as
  done until both pass.

## Code style

- Prefer functional composition and TanStack's established patterns. Do not
  introduce classes.
- Type all values and function return types explicitly. Never use `any`;
  choose precise domain types instead.
- Keep cyclomatic complexity and block nesting below four levels. Prefer source
  files under 100 lines; split files when that improves cohesion.
- Add unit tests for business logic and end-to-end tests for user-visible
  journeys. If a suitable test runner is missing, add the smallest setup needed.
- Do not edit generated files such as `src/routeTree.gen.ts`.

## UI and styling

- Implement from the product spec and established shadcn/ui patterns; do not
  invent visual designs. Use shadcn/ui primitives and components.
- Keep layouts mobile-first and responsive, and use semantic component names.
- Use only the fonts and icon library provided by the project's shadcn setup.
  Preserve the current setup unless the user requests a migration.
- Use semantic theme colors (such as `primary`, `muted`, and `destructive`)
  rather than hard-coded color values; derive variants from theme tokens.
- If a UI design choice is unclear or the spec leaves it open, ask the user
  before choosing.
