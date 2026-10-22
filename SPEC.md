# Valeriano — Product and Technical Specification

**Status:** Initial scaffold; implementation has not started.  
**Decision rule:** Anything listed under [Open questions](#open-questions) is
not yet a settled product decision.

## 1. Product

Valeriano is a single-character chatbot application. Visitors do not create
accounts. A visitor arrives through a link containing a registration token,
sees a short historical introduction presented as three or four swipeable
slides, and then enters a chat with Valeriano.

The application has no server-side conversation history. The user can start a
new conversation and may keep only the current conversation in the browser.
Administrators can generate registration tokens and edit the system prompt.

## 2. User journeys

### Visitor

1. Open a link containing a registration token.
2. Redeem it and receive a browser-held authentication credential.
3. View the Valeriano introduction as three or four swipeable slides.
4. Start a chat and talk to Valeriano.
5. Start a new conversation, replacing the current one; there is no chat
   history or server-side recovery.

An invalid, expired, or revoked credential must produce a clear recovery path,
not an empty or success-shaped chat.

### Administrator

1. Open the administration interface and authenticate using a password
   configured through an environment variable.
2. Generate registration tokens and see the generated token/usage details.
3. Change the system prompt.

The administration interface must not grow into a general-purpose user or
content-management system.

## 3. Registration and authentication tokens

- No user accounts or registration profiles are created.
- Administrators can generate as many registration tokens as needed.
- The intended allowance is **10 redemptions per registration token over its
  lifetime**.
- Successful registration creates a distinct authentication token associated
  with its registration token.
- When usage exceeds the ten-redemption threshold, the intended eviction
  candidate is the associated authentication token with the oldest
  `last_used_at` timestamp (least recently used). Do not revoke the
  oldest-created token merely because it was created first.
- Update `last_used_at` when an authentication token successfully authenticates
  a request. Define a deterministic tie-breaker (for example, oldest
  `created_at`) when timestamps match.
- Persist the token records and usage state in SQLite. Keep a small in-memory
  cache for lookups, with SQLite as the source of truth. Cache changes must be
  invalidated/updated when a token is created, used, or revoked; cache loss on
  process restart must not change authorization behavior.
- Store token digests rather than reusable plaintext secrets where practical;
  display newly generated registration tokens only at creation time.
- Authentication token material must be high entropy and revocable.
- Authentication cookies have no configured expiration date. They remain
  revocable under the usage/eviction policy.

**Policy still to define before implementation:** The lifetime redemption
allowance and eviction behavior need a precise rule for the redemption that
would exceed the limit. It is not yet decided whether that redemption is
rejected or accepted while the least-recently-used auth token is revoked. Keep
the stated ten-use intent and LRU candidate in mind, but do not implement this
edge case until the policy is confirmed.

## 4. Data and privacy

The server must not persist user messages, assistant messages, tool inputs, or
chat transcripts. Keep the current conversation in browser `localStorage` only.
Starting a new chat replaces the stored conversation. Do not write chat content
to application logs, analytics, or error reports.

Server-side persistent data is limited to access-token lifecycle/usage state
and the editable system prompt. The prompt is configuration, not user
conversation data. Store both in SQLite; SQLite is the durable source of truth
for token state. The in-memory cache is disposable and contains no additional
durable state.

The browser authentication credential is a Secure, HttpOnly cookie with no
configured expiry date and must never be included in chat transcripts. Avoid
leaving a registration token in browser history or leaking it through
referrers or logs after it is redeemed.

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

Use a local SearXNG service in Docker Compose for web search. The specific WASM
runtime and supported code language(s) are not selected yet.

## 6. User interface

- Framework: TanStack Start / TanStack Router / React.
- Components and styling: shadcn/ui, initialized with preset
  `b5rR41Mtnc`.
- The introduction has three or four swipeable slides. The actual historical
  source material and language must be supplied/approved; do not invent
  biographical or historical claims.
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
- Admin capabilities are limited to generating registration tokens and
  changing the system prompt.
- Generated tokens and prompts must not be written to logs.
- The exact admin session mechanism and password rotation behavior remain to be
  decided.

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

1. A visitor can redeem a valid registration token without creating an account.
2. Each successful redemption creates a distinct authentication token.
3. When the policy-defined redemption threshold is exceeded, the
   least-recently-used associated authentication token is selected for
   revocation, and the other tokens remain valid.
4. A revoked token cannot access chat or administration endpoints.
5. The visitor sees the intro before chat and can start a fresh conversation
   without access to earlier chats.
6. No chat transcript or tool payload is persisted server-side or logged.
7. Only the three specified model tools are available.
8. An administrator authenticated with the configured password can create
   registration tokens and update the system prompt.
9. The app can stream responses from the local llama.cpp endpoint using
   TanStack AI.
10. Token state survives server restart via SQLite, while the in-memory cache
    can be reconstructed.

## 10. Open questions

Resolve these before implementing the corresponding behavior:

1. For redemption number 11 and later, should registration be rejected, or
   should the least-recently-used authentication token be revoked and a new
   authentication token issued? The ten-use lifetime intent and eviction rule
   are recorded, but the interaction remains deliberately unresolved.
2. Which code language(s) should the WASM sandbox execute? What memory,
   execution-time, and output limits should apply?
3. What are the approved historical facts/source and language for the intro
   slides?
4. ~~Should registration tokens expire or be manually revocable?~~ Resolved:
   manually deletable by an administrator (see `specs/admin.md`); expiry is not
   implemented.
5. How will the app be deployed, and should it be containerized with the model
   server or run separately?
6. ~~Should the admin password be compared directly from the environment?~~
   Resolved: a bcrypt (htpasswd `-B` style) hash in `ADMIN_PASSWORD_HASH`;
   admin session is a 1-day HttpOnly JWT (`specs/admin.md`).

## 11. Confirmed decisions

- Auth credential: Secure, HttpOnly cookie with no configured expiry date.
- Current chat: browser `localStorage`; starting a new chat replaces/clears the
  prior current conversation.
- Editable system prompt: persist in SQLite.
- Web search: local SearXNG service in Docker Compose; backend will use its JSON
  Search API.
- Intro history and sources: to be provided later.
- Chat (basic, no tools): implemented per `specs/chat.md` (streaming via
  TanStack AI, Markdown output, `localStorage` conversation, oldest-first
  context compaction within a 5,500-token input budget).

## 12. Suggestions to consider

- Prefer Secure, HttpOnly, SameSite cookies for auth credentials and redact the
  registration token from the URL immediately after redemption.
- Rate-limit token redemption and admin login; use generic errors that do not
  reveal which tokens exist.
- Keep the inference endpoint private to the application and require bounded
  request sizes, timeouts, and concurrency to protect constrained resources.
- SearXNG forwards searches to upstream search providers. Avoid sending
  identifying or sensitive user data in search queries, and decide whether the
  UI should disclose that searches leave the local deployment.
- Add an explicit token revocation/expiry operation to administration if
  operational recovery is needed.
- `localStorage` can preserve a conversation after browser restarts. Clear the
  saved chat when a new chat starts or the associated auth session is revoked.
- Keep a short source/citation for each historical intro slide to prevent
  unsupported details from becoming part of Valeriano's character prompt.
