import { describe, expect, it } from "vitest"
import { DEFAULT_TIME_ZONE, resolveTimeZone } from "./time-zone"

describe("resolveTimeZone", () => {
  it("accepts IANA zones and falls back to Europe/Madrid", () => {
    expect(resolveTimeZone("Atlantic/Canary")).toBe("Atlantic/Canary")
    expect(resolveTimeZone("Not/AZone")).toBe(DEFAULT_TIME_ZONE)
    expect(resolveTimeZone(42)).toBe(DEFAULT_TIME_ZONE)
  })
})
