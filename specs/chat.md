# Chat (basic, no tools)

Status: implemented. Tools (web search, date/time, code execution) are a later
slice.

## Behavior

- `/chat` (authenticated only; otherwise redirects to `/`) shows one current
  conversation with Valeriano.
- The user can start a new chat ("Nuevo chat" button in the header), which stops
  any running reply and clears the conversation. There is no history browser
  and no memory across chats.
- Replies stream from the local llama.cpp OpenAI-compatible endpoint through
  TanStack AI: `chat()` on the server, `useChat` with `fetchServerSentEvents`
  on the client.
- Assistant output is rendered as Markdown (`react-markdown` + `remark-gfm`),
  styled with Tailwind classes. User messages are plain text.
- Enter sends, Shift+Enter inserts a line break. While a reply streams, the
  send button becomes a stop button.

## UI

- Built only from shadcn/ui components (`Button`, `Textarea`, `Spinner`) and
  the project's Hugeicons set.
- Background: `valeriano.webp` at 10% opacity; header and input bars are
  semi-transparent with a backdrop blur.
- Progress feedback: from sending until the first token arrives, a bubble with
  a `Spinner` and a pulsing "Valeriano está escribiendo…" is shown. Errors show
  an inline alert in Spanish.
- Font size: chat text, input and error text are `text-base` (16px) for mobile
  legibility; 16px in the input also prevents iOS Safari auto-zoom.
- Layout: the page fits the visible area and only the message list scrolls, so
  the header and input stay in view when the mobile keyboard opens.
  - `h-dvh` and `overflow-hidden` on the page.
  - `interactive-widget=resizes-content` in the viewport meta (Android/Chrome).
  - A `visualViewport` hook sets the height to the visible area on iOS Safari
    and scrolls the page back to the top.
- All user-visible text is in Spanish.

## Data and security

- The conversation lives in the browser `localStorage` only (key
  `valeriano.chat`). New chat removes it. Nothing is stored or logged
  server-side; the endpoint logs no prompts or message contents.
- `POST /api/chat` validates the auth cookie (401 otherwise), rejects bodies
  over 200 KB (400), and parses the AG-UI request body with TanStack AI's
  `chatParamsFromRequestBody`. The system prompt is read from SQLite.
- Configuration: `LLAMA_CPP_BASE_URL` (default `http://127.0.0.1:8080/v1`).
  The adapter's model name is a placeholder; llama.cpp serves a single model.

## Context compaction

Model context is 8,192 tokens. Tokens are estimated as `chars / 3` plus 8 per
message. Input (system prompt + history) is capped at 5,500 tokens, leaving the
rest for the reply (~2,700 tokens). Oldest whole messages are dropped first; the
latest message is always kept and the kept history starts on a user message. The
server applies the policy to every request; the client keeps the full local
transcript. No `max_tokens` is set (not exposed by the TanStack AI OpenAI
options), so reply length is bounded only by the remaining context.

## Acceptance criteria

1. Unauthenticated requests to `/api/chat` get 401.
2. Replies stream and render as Markdown.
3. Long conversations never send more than the input budget.
4. Reload restores the conversation; New chat clears it.
5. A progress indicator is visible while waiting for the first token.
6. With the mobile keyboard open, the header remains visible and only the
   message list scrolls.

## Tests

- Unit: compaction (`src/lib/chat-context.test.ts`).
- Not yet covered: end-to-end chat journey (needs an e2e runner), mobile
  keyboard layout (manual check on iOS and Android).

## Future / suggestions

- Per-session rate limit on `/api/chat`.
- Reply length cap if TanStack AI exposes `max_tokens`.
- Copy/regenerate actions; greeting once the intro content is approved.
