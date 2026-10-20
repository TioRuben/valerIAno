# Onboarding: token redemption and splash

## Behavior

- `GET /<token>` (8-character registration token) redeems it on the server and
  answers `302 /` with the auth cookie, so the token never stays in the URL.
- Unknown or deleted token: **HTTP 401** with the generic page "Este enlace no
  es válido o ha caducado." Failures are rate-limited per IP (5 / 15 min → 429);
  logs only contain `redeem-failure ip=<ip>`.
- Valid token and the visitor already holds a valid auth cookie: reuse that
  session (no redemption consumed).
- Valid token with free redemptions: create an auth token. If all
  `max_auth_tokens` are taken, delete the auth token with the oldest
  `COALESCE(last_used_at, created_at)` first (same transaction).
- Auth cookie `valeriano_auth`: random 256-bit secret, HttpOnly, SameSite=Lax,
  Secure in production, no expiry. SQLite stores only its SHA-256 digest in
  `auth_tokens.id`. Valid requests update `last_used_at`.

## Splash (`/`)

- Without a valid auth cookie `/` shows the generic invalid-link message.
- With a cookie: if `localStorage["valeriano:splash-seen"]` is set, redirect to
  `/chat`; otherwise show the splash.
- Full-screen `public/valeriano.webp` background; bottom quarter shows the
  centered title "Valeriano"; top three quarters hold a glass card with 4
  swipeable slides (scroll-snap), dots, "Atrás"/"Siguiente", arrow keys,
  "Saltar" (jumps to the last slide) and reduced-motion support.
- The last slide shows "Chatear con Valeriano": sets the flag and goes to
  `/chat`.
- `/chat` is an auth-guarded placeholder until the chat slice exists.

## Slide texts

Stored in `settings` (`splash_slides`, JSON array of 4 strings, max 1,000
characters each), seeded with Lorem Ipsum when unset. Edited in a new section of
`/gestion` (plain text, paragraph breaks kept). Reading them is public to
authenticated visitors only.

## Acceptance

1. Valid token creates a cookie and redirects; deleted/unknown gives 401.
2. The 11th redemption of a 10-limit token evicts the least recently used auth
   token and keeps the total at 10.
3. A visitor with a valid cookie does not consume a redemption.
4. Slides save/load from the admin page; defaults are Lorem Ipsum.
5. The CTA sets the flag; later visits to `/` go straight to `/chat`.

## Tests

Unit tests for redemption/eviction and slide storage (`*.server.test.ts`);
Playwright e2e for the splash journey.
