# Chat (basic, no tools)

## Behavior

- `/chat` (authenticated only) shows one current conversation with Valeriano.
- The user can start a new chat (button in the header), which clears the
  conversation. There is no history browser and no memory across chats.
- Replies stream from the local llama.cpp OpenAI-compatible endpoint through
  TanStack AI (`chat()` on the server, `useChat` on the client, SSE transport).
- Assistant output is rendered as Markdown (`react-markdown` + `remark-gfm`).
- The chat background is `valeriano.webp` at very low opacity.

## Scope / non-goals

No model tools yet (web search, date/time, code execution are later slices).

## Data and security

- The conversation lives in the browser `localStorage` only (key
  `valeriano.chat`). New chat removes it. Nothing is stored or logged
  server-side; the endpoint logs no prompts or message contents.
- `POST /api/chat` validates the auth cookie (401 otherwise), bounds the body
  size and message count, and builds the system prompt from SQLite.
- Configuration: `LLAMA_CPP_BASE_URL` (default `http://127.0.0.1:8080/v1`).

## Context compaction

Model context is 8,192 tokens. Tokens are estimated as `chars / 3`. Input
(system prompt + history) is capped at 5,500 tokens, leaving the rest for the
reply (~2,700 tokens). Oldest whole messages are dropped first; the latest
user message is always kept. The server applies the policy to every request;
the client keeps the full local transcript.

## Acceptance criteria

1. Unauthenticated requests to `/api/chat` get 401.
2. Replies stream and render as Markdown.
3. Long conversations never send more than the input budget.
4. Reload restores the conversation; New chat clears it.

## Tests

Unit tests cover compaction (`src/lib/chat-context.test.ts`).
