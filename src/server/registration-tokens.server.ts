import { randomInt } from "node:crypto"
import type Database from "better-sqlite3"

export const TOKEN_LENGTH = 8
export const TOKEN_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.~"

export type RegistrationTokenRow = {
  token: string
  maxAuthTokens: number
  createdAt: number
  issued: number
  used: number
  oldestInactiveAt: number | null
}

export function generateToken(): string {
  return Array.from(
    { length: TOKEN_LENGTH },
    () => TOKEN_ALPHABET[randomInt(TOKEN_ALPHABET.length)]
  ).join("")
}

export function createRegistrationToken(
  db: Database.Database,
  maxAuthTokens: number
): string {
  const insert = db.prepare(
    "INSERT OR IGNORE INTO registration_tokens (token, max_auth_tokens, created_at) VALUES (?, ?, ?)"
  )
  for (;;) {
    const token = generateToken()
    if (insert.run(token, maxAuthTokens, Date.now()).changes === 1) return token
  }
}

export function deleteRegistrationToken(
  db: Database.Database,
  token: string
): boolean {
  return (
    db
      .prepare(
        "UPDATE registration_tokens SET deleted_at = ? WHERE token = ? AND deleted_at IS NULL"
      )
      .run(Date.now(), token).changes === 1
  )
}

const LIST_SQL = `
SELECT r.token AS token, r.max_auth_tokens AS maxAuthTokens, r.created_at AS createdAt,
  COUNT(a.id) AS issued,
  COUNT(a.last_used_at) AS used,
  MIN(COALESCE(a.last_used_at, a.created_at)) AS oldestInactiveAt
FROM registration_tokens r
LEFT JOIN auth_tokens a ON a.registration_token = r.token
WHERE r.deleted_at IS NULL
GROUP BY r.token
ORDER BY r.created_at DESC`

export function listRegistrationTokens(
  db: Database.Database
): Array<RegistrationTokenRow> {
  return db.prepare(LIST_SQL).all() as Array<RegistrationTokenRow>
}
