# Model tools

Status: implemented. Extends [`chat.md`](./chat.md).

## Problem

Valeriano runs on a small local model (8,192-token context) with no knowledge
of the current date, recent events or exact arithmetic. Three server-side tools
cover those gaps. No other tools are exposed to the model.

## Tools

All tools are TanStack AI `toolDefinition()` instances with Zod input schemas,
implemented with `.server()` and passed to `chat()`. TanStack AI runs the agent
loop; it is capped with `maxIterations(4)` (at most four model turns per user
message). Inputs are validated by the schemas; every tool returns a small JSON
object, and failures return `{ "error": "<short reason>" }` instead of throwing.
The OpenAI adapter sends tool schemas in strict mode, so optional fields reach
the model as required-but-nullable; schemas accept `null` for them.

### Web search — `web_search`

- Input: `query` (1–200 characters).
- Calls the local SearXNG JSON API: `GET {SEARXNG_URL}/search?q=…&format=json`
  (`SEARXNG_URL`, default `http://127.0.0.1:8888`), 8 s timeout.
- Returns at most 5 results `{ title, url, snippet }`: title up to 120
  characters, snippet up to 200 characters. Only `http`/`https` URLs are kept.
- Searches leave the deployment through SearXNG's upstream engines; the query
  is whatever the model writes, so the tool description asks the model not to
  include personal data.

### Date and time — `current_datetime`, `add_to_date`, `date_difference`

- Time zone: the browser sends its IANA zone
  (`Intl.DateTimeFormat().resolvedOptions().timeZone`) as `timeZone` in the
  request body (AG-UI `forwardedProps`). The server accepts it only if `Intl`
  recognizes it; otherwise it uses `Europe/Madrid`.
- Dates are written `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm`, interpreted in that
  zone; `"now"`, an empty value or `null` mean the current instant (small
  models often write `"now"`). Implemented with `date-fns` and `@date-fns/tz`.
- Every request also appends one system-prompt line with the current date and
  time in that zone, e.g. "Fecha y hora actuales del usuario: martes, 3 de
  noviembre de 2026, 16:45 (Europe/Madrid)." (~20 tokens, counted in the
  history budget), so the model knows "today" without a tool call.
- `current_datetime()` → `{ iso, timeZone, text }`, where `text` is the
  `es-ES` long form (e.g. "martes, 3 de noviembre de 2026, 10:15").
- `add_to_date({ date?, years?, months?, weeks?, days?, hours?, minutes? })`
  → `{ iso, text }`. `date` defaults to now; amounts are integers (negative
  subtracts), each within ±100,000.
- `date_difference({ from, to? })` → `{ totalDays, totalHours, years, months,
days }` from `from` to `to` (default now); negative when `to` is earlier.

### Code execution — `run_javascript`

- Input: `code` (JavaScript, up to 4,000 characters).
- Runs in QuickJS compiled to WebAssembly (`quickjs-emscripten`, release-sync
  variant). Each call gets a fresh runtime and context, disposed afterwards.
- The context has only standard ECMAScript built-ins plus a `console` whose
  `log`/`info`/`warn`/`error` write to the captured output. There is no
  filesystem, network, process, timers or module loading.
- Limits: 5 s wall-clock deadline (QuickJS interrupt handler), 32 MB memory,
  1 MB stack, 2,000 characters of output (console lines, then the value of the
  last expression if it is not `undefined`); longer output ends with
  "…[truncated]".
- Returns `{ output }` or `{ error, output }` on an exception, timeout or
  memory limit.
- Each run happens in its own `worker_threads` worker, so the server's event
  loop (and other users' streams) never blocks on user code. The worker gets an
  empty environment (`env: {}`, no secrets), V8 heap limits, and is terminated
  after it replies. If it does not reply within the deadline plus 1 s, the host
  kills it with `terminate()` and returns a time-limit error, a second time
  limit independent of QuickJS. At most 2 runs at once; a third concurrent
  call gets a "busy" error.
- The worker is `src/server/tools/sandbox-worker.ts`. A small Vite plugin
  (`sandboxWorkerPlugin`) emits it as its own server chunk in production
  builds; in dev and tests Node runs the `.ts` file directly (type stripping).
  Worker messages are validated with Zod on the host.

## Context budget

- Tool definitions are sent with every request (measured: ~480 tokens). The
  history budget (system prompt + messages) drops from 5,500 to 4,500 tokens to
  leave room for them and for tool results generated during the agent loop.
- Tool calls and tool results from earlier turns are not resent: before the
  latest user message, the server removes `tool` messages and the tool calls
  of assistant messages, dropping assistant messages left empty. Only the
  current turn's tool exchange reaches the model.
- Worst case per user message: ~3 tool rounds × ~700 tokens, which still
  leaves roughly 1,000 tokens for the reply. This is an estimate; it is not
  enforced at runtime.

## UI

- While a tool runs, the assistant bubble shows a `Spinner` and a muted line:
  "Buscando en la web…", "Consultando la fecha…" or "Ejecutando código…". It
  replaces "Valeriano está escribiendo…" for that phase.
- After a reply that used `web_search`, a compact "Fuentes" list of links
  (title, opening in a new tab with `rel="noopener noreferrer"`) appears under
  the reply, deduplicated by URL, at most 5. TanStack AI stores a turn as
  several assistant messages (tool exchange, then reply), so sources are
  collected across the whole assistant turn and shown under its last message.
  Code and date tool details are not shown.
- Tool parts are kept in the browser conversation like the rest of the
  message; nothing is stored server-side.

## Data and security

- Tool inputs and outputs are never logged or persisted server-side.
- Only these five tool functions exist; the client cannot add tools (tools sent
  by the client in the AG-UI body are ignored).
- The sandbox exposes nothing from Node. Results are converted to plain
  strings before leaving QuickJS.

## Acceptance criteria

1. "¿Qué día es hoy?" answers with the date in the browser's time zone.
2. Date arithmetic questions use `add_to_date` / `date_difference`.
3. A question about recent events triggers `web_search` and shows sources.
4. Code with an infinite loop stops after ~5 s with an error; code allocating
   past 32 MB fails; `fetch`, `require` and `process` are undefined.
5. Earlier turns' tool results are not sent back to the model.
6. The running-tool indicator appears while a tool executes.

## Tests

- Unit: SearXNG result mapping, date math, date prompt, time-zone fallback, sandbox limits
  (including that the event loop keeps running during a run), tool-history stripping, client tool-part, pending-label and turn-source
  helpers.
- Manual (done 2026-11-03 against the Compose `llamacpp` Gemma 4 E4B and
  `searxng` services): current time, days until a date, web search with
  sources, code execution, and a follow-up turn after tool use.
- Known model behaviour: Gemma 4 E4B (temperature 1.0) occasionally returns an
  empty reply after a tool result, sometimes searches the web for dates instead
  of using the date tools. The date line in the system prompt addresses
  questions that only imply today's date.
- Not covered: e2e browser journey (no e2e runner yet).

## Future / suggestions


- Reuse a warm worker pool if per-run worker start-up (~100–200 ms) matters.
- Enforce a token budget during the agent loop (e.g. TanStack AI middleware)
  instead of relying on the estimate.
