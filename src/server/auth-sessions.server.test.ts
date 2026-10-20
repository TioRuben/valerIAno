import { describe, expect, it } from "vitest"
import { openMemoryDb } from "./db.server"
import { createRegistrationToken } from "./registration-tokens.server"
import {
  digestSecret,
  isValidAuthSecret,
  redeemRegistrationToken,
} from "./auth-sessions.server"
import { DEFAULT_SLIDES, readSlides, writeSlides } from "./splash-slides.server"

function secretOf(result: ReturnType<typeof redeemRegistrationToken>): string {
  if (result.status !== "created") throw new Error("expected created")
  return result.secret
}

describe("redeemRegistrationToken", () => {
  it("rejects unknown and deleted tokens", () => {
    const db = openMemoryDb()
    expect(redeemRegistrationToken(db, "nope1234").status).toBe("invalid")
    const token = createRegistrationToken(db, 2)
    db.prepare("UPDATE registration_tokens SET deleted_at = 1").run()
    expect(redeemRegistrationToken(db, token).status).toBe("invalid")
  })

  it("stores only a digest of the secret", () => {
    const db = openMemoryDb()
    const token = createRegistrationToken(db, 2)
    const secret = secretOf(redeemRegistrationToken(db, token))
    const ids = db.prepare("SELECT id FROM auth_tokens").all()
    expect(ids).toEqual([{ id: digestSecret(secret) }])
    expect(isValidAuthSecret(db, secret)).toBe(true)
  })

  it("reuses a valid session without consuming a redemption", () => {
    const db = openMemoryDb()
    const token = createRegistrationToken(db, 2)
    const secret = secretOf(redeemRegistrationToken(db, token))
    expect(redeemRegistrationToken(db, token, secret).status).toBe("reused")
    expect(db.prepare("SELECT COUNT(*) AS c FROM auth_tokens").get()).toEqual({
      c: 1,
    })
  })

  it("evicts the least recently used session when the limit is reached", () => {
    const db = openMemoryDb()
    const token = createRegistrationToken(db, 2)
    const first = secretOf(redeemRegistrationToken(db, token))
    const second = secretOf(redeemRegistrationToken(db, token))
    db.prepare("UPDATE auth_tokens SET last_used_at = ? WHERE id = ?").run(
      1,
      digestSecret(first)
    )
    const third = secretOf(redeemRegistrationToken(db, token))
    expect(isValidAuthSecret(db, first)).toBe(false)
    expect(isValidAuthSecret(db, second)).toBe(true)
    expect(isValidAuthSecret(db, third)).toBe(true)
  })
})

describe("splash slides", () => {
  it("defaults to Lorem Ipsum and round-trips edits", () => {
    const db = openMemoryDb()
    expect(readSlides(db)).toEqual(DEFAULT_SLIDES)
    const slides = ["a", "b", "c", "d"]
    writeSlides(db, slides)
    expect(readSlides(db)).toEqual(slides)
  })

  it("rejects wrong counts and oversized slides", () => {
    const db = openMemoryDb()
    expect(() => writeSlides(db, ["a"])).toThrow()
    expect(() => writeSlides(db, ["a", "b", "c", "x".repeat(1001)])).toThrow()
  })
})
