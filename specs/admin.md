# Administration page (`/gestion`)

## Behavior

- All visible text, accessibility labels, and errors are in Spanish; dates use
  the `es-ES` locale.
- Reachable only by typing `/gestion`; it is not linked anywhere, not in
  `robots.txt`, and is served with `X-Robots-Tag: noindex`.
- Unauthenticated visitors see a password form. A correct password sets an
  `HttpOnly`, `SameSite=Strict`, `Secure` (except over plain HTTP in dev) JWT
  cookie carrying `admin: true`, valid for 1 day. A logout button clears it.
- Three sections:
  1. **Instrucciones del sistema**: a single shadcn textarea (max 4000 chars,
     character counter) with a Save button. No history.
  2. **Introducción**: exactly four plain-text slide editors (max 1,000
     characters each), preserving paragraph breaks. Defaults to Lorem Ipsum
     until edited. Save updates SQLite; no version history.
  3. **Tokens de registro**: a table with token, "Emitidos" (current
     auth-session count / concurrent-session limit), "Usados" (auth tokens with
     a non-null `last_used_at`) and "Más antiguo sin actividad" (minimum
     effective last-use time of its auth tokens). Row actions: copy URL and
     delete, nothing else.
- Each section saves explicitly and reports the result as inline status text
  ("Guardado" / "No se pudo guardar."); there are no toasts.
- Creating a token: slider (1–50, default 10) plus a number input to type the
  limit ("Usos permitidos"). The limit is the **maximum number of concurrent
  auth sessions** for that token (`SPEC.md` §3), not a lifetime redemption
  count. The full redeem URL (`<APP_URL or request origin>/<token>`, no query
  string) is shown with a copy button, and the token appears in the table.
- Deleting only makes the token unredeemable; existing auth tokens keep working.
- No separate redeem screen exists: opening a valid token URL redeems it on
  the server, sets the auth cookie, and redirects to `/`.

## Tokens

- 8 characters from `A-Za-z0-9-_.~` (URL-safe, hard to guess) using
  `crypto.randomInt`; unique (retry on collision). Symbols such as `?#/&%` are
  excluded because they would break `/<token>`.
- Stored in plaintext so the admin can copy the URL again from the table
  (deliberate deviation from the digest preference in `SPEC.md` §3;
  admin-only access). Auth-session secrets, in contrast, are stored only as
  SHA-256 digests.

## Configuration (`.env`, see `.env.example`)

| Variable              | Purpose                                                                                         |
| --------------------- | ----------------------------------------------------------------------------------------------- |
| `ADMIN_PASSWORD_HASH` | bcrypt hash; startup validation rejects other formats (e.g. `$apr1$`) with an explanatory error |
| `JWT_SECRET`          | HS256 signing key, at least 32 characters                                                       |
| `APP_URL`             | Optional base for redeem URLs; falls back to the request origin                                 |
| `TRUST_PROXY`         | `true` to read the client IP from `X-Forwarded-For`                                             |
| `DATABASE_PATH`       | SQLite file (default `./data/valeriano.sqlite`)                                                 |

## Security

- Password: bcrypt hash (`htpasswd -nbB` style, `$2y$`) in `ADMIN_PASSWORD_HASH`.
  `pnpm hash-password "<password>"` prints the ready-to-paste `.env` line with
  each `$` escaped as `\$`. `htpasswd` without `-B` produces `$apr1$` (MD5),
  which is rejected.
- JWT signed (HS256) with `JWT_SECRET` (min 32 chars) using `jose`; claims
  `admin: true`, 1-day expiry (admin only). Cookie `valeriano_admin`:
  `HttpOnly`, `SameSite=Strict`, `Path=/`, `Secure` in production.
- Every admin server function verifies the JWT server-side. Logout clears the
  cookie; rotating `JWT_SECRET` invalidates every admin session.
- No role is shared with visitors: an auth-session cookie never grants admin
  access.
- Failed login or invalid/missing admin token returns **HTTP 401**; too many
  failures from one IP (5 per 15 min) return 429. Failures are logged as a
  single line `admin-auth-failure ip=<ip>` (no passwords, tokens, or prompts)
  to allow fail2ban filters.
- Generic Spanish error on failure ("No se pudo iniciar sesión.").
- Admin server functions require a valid admin JWT and validate prompt/slide
  input lengths before writing.

## Storage

SQLite (`DATABASE_PATH`, better-sqlite3): `registration_tokens`
(`token`, `max_auth_tokens`, `created_at`, `deleted_at`), `auth_tokens`
(`id` contains the SHA-256 digest of the auth secret, `registration_token`,
`created_at`, `last_used_at`) and `settings` (`key`, `value`) for the system
prompt and `splash_slides` JSON value.

## Acceptance criteria

1. Wrong password → 401, no cookie; correct → cookie with 1-day expiry.
2. Admin functions reject requests without a valid admin JWT (401).
3. Created token matches the alphabet/length, respects the limit.
4. Deleting sets `deleted_at`; the token no longer appears as redeemable.
5. Prompt over 4000 chars is rejected.
6. Introduction has exactly four editable strings; any slide over 1000
   characters or a different slide count is rejected.
7. The intro section and saving slides are available only to authenticated
   administrators.

8. All visible text is Spanish.

## Tests

Unit: token generation/listing/deletion, JWT, bcrypt `$2y$` verification, rate
limiter and system prompt (`src/server/*.test.ts`). The admin journey was
verified manually in a browser; there is no e2e runner yet.

## Known limitations

- Redemption sets `last_used_at` at creation, so "Usados" currently equals
  "Emitidos".
- The redeem rate limiter (`specs/onboarding.md`) only sees a real client IP
  when `TRUST_PROXY=true`; otherwise all clients share one bucket.

## Resolves in `SPEC.md`

- Registration tokens are manually deletable; there is no expiry.
- The admin password is provided as a bcrypt hash; the admin session is a
  1-day HttpOnly JWT.
