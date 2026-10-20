# Administration page (`/gestion`)

## Behavior

- All visible text, accessibility labels, and errors are in Spanish; dates use
  the `es-ES` locale.
- Reachable only by typing `/gestion`; it is not linked anywhere, not in
  `robots.txt`, and is served with `X-Robots-Tag: noindex`.
- Unauthenticated visitors see a password form. A correct password sets an
  `HttpOnly`, `SameSite=Strict`, `Secure` (except over plain HTTP in dev) JWT
  cookie carrying `admin: true`, valid for 1 day. A logout button clears it.
- Two sections:
  1. **System prompt**: a single textarea (max 4000 chars) with a Save button.
     No history.
  2. **Registration tokens**: a table with token, issued (redemptions so
     far / limit), used (auth tokens that authenticated at least once) and
     oldest inactive (minimum `last_used_at` of its auth tokens). Row actions:
     copy URL and delete.
- Creating a token: slider (1–50, default 10) plus a number input to type the
  limit. The full redeem URL (`<APP_URL or request origin>/<token>`) is shown
  with a copy button, and the token appears in the table.
- Deleting only makes the token unredeemable; existing auth tokens keep working.
- No redeem screen exists yet.

## Tokens

- 8 characters from `A-Za-z0-9-_.~` using `crypto.randomInt`; unique.
- Stored in plaintext so the admin can copy the URL again (deliberate
  deviation from the digest preference in `SPEC.md` §3; admin-only access).

## Security

- Password: bcrypt hash (`htpasswd -nbB` style, `$2y$`) in `ADMIN_PASSWORD_HASH`.
  `pnpm hash-password` generates it. `$` must be escaped as `\$` in `.env`.
- JWT signed (HS256) with `JWT_SECRET` (min 32 chars) using `jose`.
- Every admin server function verifies the JWT server-side.
- Failed login or invalid/missing admin token returns **HTTP 401**; too many
  failures from one IP (5 per 15 min) return 429. Failures are logged as a
  single line `admin-auth-failure ip=<ip>` (no passwords, tokens, or prompts)
  to allow fail2ban filters.
- Generic error message on failure.

## Storage

SQLite (`DATABASE_PATH`, better-sqlite3): `registration_tokens`
(`token`, `max_auth_tokens`, `created_at`, `deleted_at`), `auth_tokens`
(`id`, `registration_token`, `created_at`, `last_used_at`; created by the later
redeem slice) and `settings` (`key`, `value`) for the system prompt.

## Acceptance criteria

1. Wrong password → 401, no cookie; correct → cookie with 1-day expiry.
2. Admin functions reject requests without a valid admin JWT (401).
3. Created token matches the alphabet/length, respects the limit.
4. Deleting sets `deleted_at`; the token no longer appears as redeemable.
5. Prompt over 4000 chars is rejected.

## Resolves in `SPEC.md`

- Open question 4: registration tokens are manually deletable (no expiry yet).
- Open question 6: the admin password is provided as a bcrypt hash.
