# Onboarding: token redemption and splash

## Behavior

- `GET /<token>` (8-character registration token) redeems it on the server and
  answers `302 /` with the auth cookie, so the token never stays in the URL.
- Unknown or deleted token: **HTTP 401** with the generic page "Este enlace no
  es válido o ha caducado." (also served by `/` without a valid cookie).
  Failures are rate-limited per IP (5 / 15 min → 429); logs only contain
  `redeem-failure ip=<ip>` (fail2ban-friendly). The client IP comes from
  `X-Forwarded-For` only when `TRUST_PROXY=true`; otherwise all clients share
  one bucket.
- Valid token and the visitor already holds a valid auth cookie: reuse that
  session (no new auth token is created).
- A registration token's `max_auth_tokens` is a concurrent-session limit, not a
  lifetime redemption limit. When full, delete the associated auth token with
  the oldest `COALESCE(last_used_at, created_at)` first (oldest `created_at`
  breaks ties), then create the new one in the same transaction.
- Auth cookie `valeriano_auth`: random 256-bit secret, HttpOnly, SameSite=Lax,
  Secure in production, effectively non-expiring (10-year `Max-Age`). SQLite
  stores only its SHA-256 digest in
  `auth_tokens.id`. Valid requests update `last_used_at`. Auth sessions remain
  revocable by deleting their database record.

## Splash (`/`)

- Without a valid auth cookie `/` shows the generic invalid-link message.
- With a cookie: if `localStorage["valeriano:splash-seen"]` is set, redirect to
  `/chat`; otherwise show the splash.
- Full-screen cover background from `public/valeriano.webp`. A variable-height
  glass-effect box is anchored at the bottom, with a maximum height of 70svh;
  it grows or shrinks with the content. Text wraps inside it and scrolls
  vertically when it exceeds the available height.
- Box content order: centered black "Valeriano" title, slide text, then
  controls. The box stays below the face to keep it visible.
- Exactly 4 swipeable slides (scroll-snap), dots, "Atrás"/"Siguiente" and
  left/right arrow keys. There is no skip option. Programmatic transitions
  respect reduced-motion preferences.
- The final slide's "Chatear con Valeriano" button sets
  `localStorage["valeriano:splash-seen"] = "1"` and navigates to `/chat`.
- `/chat` is auth-guarded (redirects to `/` otherwise); see `specs/chat.md`.

## Slide texts

Stored in SQLite `settings` (`splash_slides`, JSON array of exactly 4 strings,
max 1,000 characters each), defaulting to Lorem Ipsum when unset. Edited in the
"Introducción" section of `/gestion` as plain text; paragraph breaks are kept.
Slide texts are returned only when the visitor has a valid auth cookie.

## Acceptance

1. Valid token creates a cookie and redirects to `/`; deleted/unknown token
   returns 401 with "Este enlace no es válido o ha caducado."
2. Redeeming when `max_auth_tokens` sessions already exist evicts the least
   recently used session, creates a new one and keeps the concurrent session
   count at the configured limit.
3. A visitor with a valid cookie opening a valid registration link reuses the
   session without creating another auth token.
4. Five failed redemptions from one IP within 15 minutes cause HTTP 429.
5. Slides save/load from the admin page; defaults are Lorem Ipsum and limits
   are enforced.
6. The title precedes the text and controls inside the variable-height bottom
   box; content never overflows the box.
7. The CTA sets the localStorage flag; later visits to `/` go straight to
   `/chat`.

## Tests

Unit tests for redemption/eviction and slide storage (`*.server.test.ts`);
manual browser verification for the responsive splash journey. Playwright e2e
coverage is not yet configured.
