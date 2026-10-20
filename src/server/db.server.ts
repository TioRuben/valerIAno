import { mkdirSync } from "node:fs"
import { dirname } from "node:path"
import Database from "better-sqlite3"
import { getConfig } from "./config.server"

const SCHEMA = `
CREATE TABLE IF NOT EXISTS registration_tokens (
  token TEXT PRIMARY KEY,
  max_auth_tokens INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  deleted_at INTEGER
);
CREATE TABLE IF NOT EXISTS auth_tokens (
  id TEXT PRIMARY KEY,
  registration_token TEXT NOT NULL REFERENCES registration_tokens(token),
  created_at INTEGER NOT NULL,
  last_used_at INTEGER
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`

let instance: Database.Database | undefined

export function getDb(): Database.Database {
  if (instance) return instance
  const { DATABASE_PATH } = getConfig()
  mkdirSync(dirname(DATABASE_PATH), { recursive: true })
  instance = new Database(DATABASE_PATH)
  instance.pragma("journal_mode = WAL")
  instance.exec(SCHEMA)
  return instance
}

export function openMemoryDb(): Database.Database {
  const db = new Database(":memory:")
  db.exec(SCHEMA)
  return db
}
