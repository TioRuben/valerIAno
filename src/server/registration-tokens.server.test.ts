import { describe, expect, it } from "vitest"
import { openMemoryDb } from "./db.server"
import {
  TOKEN_ALPHABET,
  createRegistrationToken,
  deleteRegistrationToken,
  generateToken,
  listRegistrationTokens,
} from "./registration-tokens.server"

describe("registration tokens", () => {
  it("generates 8 characters from the alphabet", () => {
    const token = generateToken()
    expect(token).toHaveLength(8)
    expect([...token].every((c) => TOKEN_ALPHABET.includes(c))).toBe(true)
  })

  it("lists created tokens with their limit and counters", () => {
    const db = openMemoryDb()
    const token = createRegistrationToken(db, 7)
    expect(listRegistrationTokens(db)).toEqual([
      expect.objectContaining({ token, maxAuthTokens: 7, issued: 0, used: 0 }),
    ])
  })

  it("counts issued and used auth tokens and the oldest activity", () => {
    const db = openMemoryDb()
    const token = createRegistrationToken(db, 10)
    const insert = db.prepare(
      "INSERT INTO auth_tokens (id, registration_token, created_at, last_used_at) VALUES (?, ?, ?, ?)"
    )
    insert.run("a", token, 100, null)
    insert.run("b", token, 200, 500)
    const [row] = listRegistrationTokens(db)
    expect(row).toMatchObject({ issued: 2, used: 1, oldestInactiveAt: 100 })
  })

  it("hides deleted tokens but keeps their auth tokens", () => {
    const db = openMemoryDb()
    const token = createRegistrationToken(db, 3)
    db.prepare(
      "INSERT INTO auth_tokens (id, registration_token, created_at) VALUES ('a', ?, 1)"
    ).run(token)
    expect(deleteRegistrationToken(db, token)).toBe(true)
    expect(deleteRegistrationToken(db, token)).toBe(false)
    expect(listRegistrationTokens(db)).toEqual([])
    expect(db.prepare("SELECT COUNT(*) AS n FROM auth_tokens").get()).toEqual({
      n: 1,
    })
  })
})
