# Valeriano — Product and Technical Specification

**Status:** Implemented in slices; see the feature specifications in `specs/`.  
**Decision rule:** Anything listed under [Open questions](#open-questions) is
not yet a settled product decision.

## 1. Product

Valeriano is a single-character chatbot application. Visitors do not create
accounts. A visitor arrives through a link containing a registration token,
sees a four-slide introduction, and then enters a chat with Valeriano.

The application has no server-side conversation history. The user can start a
new conversation and may keep only the current conversation in the browser.
Administrators can generate registration tokens, edit the system prompt, and
edit the text of the introduction.

## 2. User journeys

### Visitor

1. Open a link containing a registration token.
2. Redeem it and receive a browser-held authentication credential in a Secure,
   HttpOnly cookie.
3. View the Valeriano introduction as four swipeable slides (unless it has
   already been completed in that browser).
4. Start a chat and talk to Valeriano.
5. Start a new conversation, replacing the current one; there is no chat
   history or server-side recovery.

An invalid, expired, or revoked credential must produce a clear recovery path,
not an empty or success-shaped chat.

### Administrator

1. Open the administration interface and authenticate using a password
   configured through an environment variable.
2. Generate registration tokens and see the generated token/usage details.
3. Change the system prompt and introduction slide texts.

The administration interface must not grow into a general-purpose user or
content-management system.

## 3. Registration and authentication tokens

- No user accounts or registration profiles are created.
- Administrators can generate as many registration tokens as needed.
- Each registration token has a configurable maximum number of concurrent
  authentication sessions (1–50; the admin default is 10). It is not a
  lifetime redemption limit: a registration token remains redeemable until
  deleted.
- Successful registration creates a distinct authentication token associated
  with its registration token.
- When the session limit is full and a new session is requested, revoke the
  associated authentication token with the oldest effective last-use time
  (`COALESCE(last_used_at, created_at)`); break ties by oldest `created_at`.
  Issue the new session in the same transaction. Do not reject the redemption.
- A visitor presenting a valid auth cookie while opening an available
  registration link reuses that session; no additional auth session is
  created.
- Update `last_used_at` when an authentication token successfully authenticates
  a request. When eviction times tie, use the oldest `created_at`.
- Persist token records and usage state in SQLite, the source of truth.
- Store authentication-token digests rather than reusable plaintext secrets.
  Registration tokens are stored in plaintext because the admin table displays
  them and allows copying their redeem URLs.
- Authentication token material must be high entropy and revocable.
- Authentication cookies have no configured expiration date. They remain
  revocable under the usage/eviction policy.

## 4. Data and privacy

The server must not persist user messages, assistant messages, tool inputs, or
chat transcripts. Keep the current conversation in browser `localStorage` only.
Starting a new chat replaces the stored conversation. Do not write chat content
to application logs, analytics, or error reports.

Server-side persistent data includes access-token lifecycle/usage state, the
editable system prompt, and four editable introduction slide texts. Store these
in SQLite. The prompt and slide texts are configuration/content, not user
conversation data.

The browser authentication credential is a Secure, HttpOnly, SameSite=Lax
cookie and must never be included in chat transcripts. After a successful
redemption, respond with a redirect to `/` so the registration token is removed
from the address bar. Do not log tokens, prompts, or conversation content.

## 5. Chat and model tools

- Character: **Valeriano**.
- Model provider: the existing local llama.cpp server, exposing its
  OpenAI-compatible API.
- Framework: use TanStack AI for chat streaming and typed tool definitions. Its
  OpenAI-compatible adapter is sufficient for llama.cpp; no additional AI
  orchestration SDK is planned.
- Only these model tools are allowed:
  1. Web search.
  2. Date/time functions.
  3. Sandboxed code execution using WebAssembly.
- Tool implementations execute server-side and must validate input, bound
  execution time and output size, and return only the minimum necessary data.
  The WASM sandbox must not gain ambient filesystem, process, or network access
  unless a separate requirement explicitly allows it.
- Keep system prompts and request context compact. The current Compose
  configuration sets an 8,192-token model context and quantized KV cache.
  Bound history sent to inference, define a context-compaction policy, and
  avoid resending unbounded transcripts or tool output.

Use a local SearXNG service in Docker Compose for web search. The WASM sandbox
runs JavaScript in QuickJS (`quickjs-emscripten`); see `specs/tools.md`.

## 6. User interface

- Framework: TanStack Start / TanStack Router / React.
- Components and styling: shadcn/ui, initialized with preset
  `b5rR41Mtnc`.
- The introduction has exactly four swipeable slides, with text managed in
  `/gestion` as plain text (paragraph breaks preserved, up to 1,000 characters
  per slide). Until approved historical copy is provided, each slide defaults
  to Lorem Ipsum.
- The introduction uses `public/valeriano.webp` as a full-screen cover
  background. A variable-height translucent glass box sits at the bottom of
  the viewport, grows with its content and is capped at 70svh; excess slide
  text scrolls inside the box and wraps rather than overflowing it. The box
  order is the black "Valeriano" title, slide text, then slide controls.
- Slides support swiping/scroll-snap, dots, "Atrás" and "Siguiente" buttons,
  and left/right arrow keys. There is no skip option. Respect reduced-motion
  preferences for programmatic slide transitions.
- Completing the final slide with "Chatear con Valeriano" stores
  `valeriano:splash-seen=1` in browser localStorage and navigates to `/chat`.
  On later visits to `/`, a valid visitor with that flag goes directly to
  `/chat`.
- The chat view supports one current conversation and an explicit “new chat”
  action. A new chat clears the previous client-side conversation.
- No server-side chat-history browser or account settings are in scope.
- Mobile and keyboard-accessible navigation are required for the slides and
  chat.

## 7. Administration and configuration

- The admin password is supplied by an environment variable and is never
  committed. An example variable name is documented in `.env.example`.
- Protect admin routes/actions server-side; hiding admin controls in the UI is
  not authorization.
- Admin capabilities are limited to generating/deleting registration tokens,
  changing the system prompt, and editing the four introduction slide texts.
- Generated tokens and prompts must not be written to logs.
- Admin authentication uses a bcrypt password hash in
  `ADMIN_PASSWORD_HASH` and a 1-day HttpOnly JWT cookie. Password rotation is
  performed by updating the environment configuration and restarting the app.

## 8. Runtime and operations

- The existing llama.cpp service remains the local inference service.
- SearXNG runs as a separate local Docker Compose service. Enable its JSON
  Search API for the application's backend; do not expose it publicly by
  default.
- The unused Open WebUI service and its persistent volume are removed from
  Compose so chat content is not accidentally stored by a separate UI and
  unnecessary runtime resources are not consumed.
- The llama.cpp host port is bound to loopback for local development; do not
  expose the model server publicly without an explicit deployment decision.
- SQLite is the durable store for token lifecycle data. Backups must not
  contain conversations because none are stored server-side.
- Secrets, SQLite files, and model weights are excluded from version control.

## 9. Acceptance criteria

1. A visitor can redeem an available registration token without creating an
   account; success redirects to `/` and sets an auth cookie.
2. Each new session creates a distinct authentication token; a valid existing
   cookie is reused.
3. When the concurrent session limit is full, the least-recently-used
   associated token is revoked and replaced; all other sessions remain valid.
4. A revoked token cannot access chat or administration endpoints.
5. The visitor sees the intro before chat and can start a fresh conversation
   without access to earlier chats.
6. No chat transcript or tool payload is persisted server-side or logged.
7. Only the three specified model tools are available.
8. An administrator authenticated with the configured password can manage
   registration tokens, update the system prompt, and edit introduction text.
9. The app can stream responses from the local llama.cpp endpoint using
   TanStack AI.
10. Token state and editable prompt/slide content survive server restart via
    SQLite.

## 10. Open questions

Resolve these before implementing the corresponding behavior:

1. ~~Which code language(s) should the WASM sandbox execute? What memory,
   execution-time, and output limits should apply?~~ Resolved: JavaScript in
   QuickJS (WASM); 5 s, 32 MB memory, 2,000 characters of output
   (`specs/tools.md`).
2. What are the approved historical facts/source and language for the intro
   slides? Current Lorem Ipsum is placeholder text.
3. ~~Should registration tokens expire or be manually revocable?~~ Resolved:
   manually deletable by an administrator (see `specs/admin.md`); expiry is not
   implemented.
4. How will the app be deployed, and should it be containerized with the model
   server or run separately?
5. ~~Should the admin password be compared directly from the environment?~~
   Resolved: a bcrypt (htpasswd `-B` style) hash in `ADMIN_PASSWORD_HASH`;
   admin session is a 1-day HttpOnly JWT (`specs/admin.md`).

## 11. Confirmed decisions

- Auth credential: Secure, HttpOnly, SameSite=Lax cookie; its secret is
  high-entropy and only its SHA-256 digest is stored in SQLite.
- Registration redemption: unknown/deleted token returns HTTP 401 with the
  generic Spanish message; 5 failures per IP per 15 minutes trigger HTTP 429.
- Full registration-token allowance: evict the oldest effective-last-use
  session and issue a replacement; valid existing sessions are reused.
- Splash: exactly four editable plain-text slides, Lorem Ipsum defaults, no
  skip control; the black title appears above the text inside the dynamic
  bottom glass box.
- Current chat: browser `localStorage`; starting a new chat replaces/clears the
  prior current conversation.
- Editable system prompt: persist in SQLite.
- Introduction text: four plain-text slides in SQLite, editable in `/gestion`,
  with Lorem Ipsum defaults and a 1,000-character limit per slide.
- Admin authentication: bcrypt password hash and 1-day HttpOnly JWT cookie.
- Web search: local SearXNG service in Docker Compose; backend will use its JSON
  Search API.
- Intro history and sources: to be provided later; no biographical claims are
  invented in the meantime.
- Chat (basic, no tools): implemented per `specs/chat.md` (streaming via
  TanStack AI, Markdown output, `localStorage` conversation, oldest-first
  context compaction within a 5,500-token input budget).
- Language: the whole application is in Spanish (`es-ES` for dates and
  numbers); code, comments, logs and technical docs may be English.
- Admin page: `/gestion`, reachable only by typing the URL (not linked,
  `noindex`). Registration tokens are 8 URL-safe characters
  (`A-Za-z0-9-_.~`), stored in plaintext so the admin can copy the URL again;
  redeem URLs are `<APP_URL or request origin>/<token>`. The per-token limit
  (slider 1–50, default 10, also typeable) is a concurrent-session limit.
  Deleting a token only stops new redemptions; existing sessions stay valid.
- Brute-force protection: failed admin logins and failed redemptions return
  HTTP 401 and log a single `admin-auth-failure ip=` / `redeem-failure ip=`
  line for fail2ban; 5 failures per IP per 15 minutes return 429. The client
  IP is read from `X-Forwarded-For` only when `TRUST_PROXY=true`.
- Persistence: SQLite through `better-sqlite3`; the system prompt is capped at
  4,000 characters.
- Installable PWA with a static-assets-only service worker (`specs/pwa.md`).
- Model tools (`specs/tools.md`): `web_search` (SearXNG, 5 results),
  `current_datetime` / `add_to_date` / `date_difference` (browser time zone,
  fallback `Europe/Madrid`; the current date is also a system-prompt line)
  and `run_javascript` (QuickJS WASM, 5 s, 32 MB,
  2,000-character output). Running tools show a status line; web search
  sources are listed under the reply.

## 12. Suggestions to consider

- Keep the inference endpoint private to the application and require bounded
  request sizes, timeouts, and concurrency to protect constrained resources.
- SearXNG forwards searches to upstream search providers. Avoid sending
  identifying or sensitive user data in search queries, and decide whether the
  UI should disclose that searches leave the local deployment.
- Consider a separate operation to revoke an individual auth session if
  operational recovery beyond deleting its registration token is needed.
- `localStorage` can preserve a conversation after browser restarts. Clear the
  saved chat when a new chat starts or the associated auth session is revoked.
- Keep a short source/citation for each historical intro slide to prevent
  unsupported details from becoming part of Valeriano's character prompt.
