import bcrypt from "bcryptjs"
import { describe, expect, it } from "vitest"
import {
  isAdminToken,
  signAdminToken,
  verifyPassword,
} from "./admin-jwt.server"
import { createRateLimiter } from "./rate-limiter.server"
import { openMemoryDb } from "./db.server"
import { readSystemPrompt, writeSystemPrompt } from "./system-prompt.server"

const SECRET = "x".repeat(32)

describe("admin jwt", () => {
  it("accepts a signed admin token and rejects others", async () => {
    expect(await isAdminToken(await signAdminToken(SECRET), SECRET)).toBe(true)
    expect(
      await isAdminToken(await signAdminToken(SECRET), "y".repeat(32))
    ).toBe(false)
    expect(await isAdminToken("garbage", SECRET)).toBe(false)
    expect(await isAdminToken(undefined, SECRET)).toBe(false)
  })

  it("verifies htpasswd-style $2y$ hashes", async () => {
    const hash = (await bcrypt.hash("secret", 4)).replace("$2b$", "$2y$")
    expect(await verifyPassword("secret", hash)).toBe(true)
    expect(await verifyPassword("wrong", hash)).toBe(false)
  })
})

describe("rate limiter", () => {
  it("blocks after the maximum failures until the window passes", () => {
    const limiter = createRateLimiter(2, 1000)
    limiter.recordFailure("ip", 0)
    expect(limiter.isBlocked("ip", 1)).toBe(false)
    limiter.recordFailure("ip", 2)
    expect(limiter.isBlocked("ip", 3)).toBe(true)
    expect(limiter.isBlocked("ip", 1500)).toBe(false)
  })
})

describe("system prompt", () => {
  it("persists and bounds the prompt", () => {
    const db = openMemoryDb()
    writeSystemPrompt(db, "hello")
    writeSystemPrompt(db, "bye")
    expect(readSystemPrompt(db)).toBe("bye")
    expect(() => writeSystemPrompt(db, "a".repeat(4001))).toThrow()
  })
})
