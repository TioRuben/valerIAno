import { describe, expect, it } from "vitest"
import { buildSystemPrompts, currentDatePrompt } from "./date-prompt"

const NOW = new Date("2026-11-03T15:45:00Z")

describe("currentDatePrompt", () => {
  it("states the date and time in the user's zone", () => {
    expect(currentDatePrompt("Europe/Madrid", NOW)).toBe(
      "Fecha y hora actuales del usuario: martes, 3 de noviembre de 2026, 16:45 (Europe/Madrid)."
    )
  })
})

describe("buildSystemPrompts", () => {
  it("appends the date after the configured prompt", () => {
    const prompts = buildSystemPrompts(
      "Eres Valeriano.",
      "Atlantic/Canary",
      NOW
    )
    expect(prompts).toHaveLength(2)
    expect(prompts[0]).toBe("Eres Valeriano.")
    expect(prompts[1]).toContain("15:45 (Atlantic/Canary)")
  })

  it("uses only the date when there is no configured prompt", () => {
    expect(buildSystemPrompts("", "Europe/Madrid", NOW)).toHaveLength(1)
  })
})
