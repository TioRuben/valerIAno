import type Database from "better-sqlite3"

export const MAX_PROMPT_LENGTH = 4000
const KEY = "system_prompt"

export function readSystemPrompt(db: Database.Database): string {
  const row = db
    .prepare("SELECT value FROM settings WHERE key = ?")
    .get(KEY) as { value: string } | undefined
  return row?.value ?? ""
}

export function writeSystemPrompt(db: Database.Database, prompt: string): void {
  if (prompt.length > MAX_PROMPT_LENGTH) {
    throw new Error(
      "Las instrucciones del sistema superan el límite permitido."
    )
  }
  db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).run(KEY, prompt)
}
