# Feature specifications

`SPEC.md` is the product-level specification. Add one short specification per
substantial feature here before implementing it.

## Feature specifications

- [`admin.md`](./admin.md): administrator authentication, registration tokens,
  system prompt and introduction editor.
- [`onboarding.md`](./onboarding.md): token redemption, auth sessions, intro
  splash and the `/chat` entry gate.
- [`chat.md`](./chat.md): client-only conversation and local model streaming.
- [`pwa.md`](./pwa.md): installability and static-asset service-worker cache.

Each feature spec should include:

1. The problem and user-visible behavior.
2. Scope and explicit non-goals.
3. Data and security implications, especially what is stored client-side versus
   server-side.
4. Acceptance criteria that can be verified.
5. Tests and operational considerations.

Resolve relevant open questions in `SPEC.md` before treating a feature spec as
approved.

## Index

| Spec | Scope |
| --- | --- |
| [admin.md](./admin.md) | `/gestion`: admin login, system prompt, intro slides, registration tokens |
| [onboarding.md](./onboarding.md) | Token redemption, auth sessions, splash |
| [chat.md](./chat.md) | `/chat`: streaming conversation, local storage, context compaction |
| [pwa.md](./pwa.md) | Manifest and static-asset service worker |

Pending slices (tools: web search, date/time, WASM code execution) have no spec
yet.
