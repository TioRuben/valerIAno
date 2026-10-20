import { createHash, randomBytes } from "node:crypto"
import type Database from "better-sqlite3"

export const AUTH_COOKIE = "valeriano_auth"

export type RedeemResult =
  | { status: "invalid" }
  | { status: "reused" }
  | { status: "created"; secret: string }

type TokenRow = { max_auth_tokens: number }

export function digestSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex")
}

export function isValidAuthSecret(
  db: Database.Database,
  secret: string | undefined
): boolean {
  if (!secret) return false
  return (
    db
      .prepare("UPDATE auth_tokens SET last_used_at = ? WHERE id = ?")
      .run(Date.now(), digestSecret(secret)).changes === 1
  )
}

function evictOldest(db: Database.Database, token: string): void {
  db.prepare(
    `DELETE FROM auth_tokens WHERE id = (
       SELECT id FROM auth_tokens WHERE registration_token = ?
       ORDER BY COALESCE(last_used_at, created_at) ASC, created_at ASC LIMIT 1)`
  ).run(token)
}

export function redeemRegistrationToken(
  db: Database.Database,
  token: string,
  existingSecret?: string
): RedeemResult {
  const row = db
    .prepare(
      "SELECT max_auth_tokens FROM registration_tokens WHERE token = ? AND deleted_at IS NULL"
    )
    .get(token) as TokenRow | undefined
  if (!row) return { status: "invalid" }
  if (isValidAuthSecret(db, existingSecret)) return { status: "reused" }
  const secret = randomBytes(32).toString("base64url")
  db.transaction((): void => {
    const { count } = db
      .prepare(
        "SELECT COUNT(*) AS count FROM auth_tokens WHERE registration_token = ?"
      )
      .get(token) as { count: number }
    if (count >= row.max_auth_tokens) evictOldest(db, token)
    const now = Date.now()
    db.prepare(
      "INSERT INTO auth_tokens (id, registration_token, created_at, last_used_at) VALUES (?, ?, ?, ?)"
    ).run(digestSecret(secret), token, now, now)
  })()
  return { status: "created", secret }
}
