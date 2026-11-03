import { describe, expect, it } from "vitest"
import type { UIMessage } from "@tanstack/ai-react"
import { TYPING_LABEL, pendingLabel } from "./tool-parts"

function assistant(parts: UIMessage["parts"]): UIMessage {
  return { id: "m1", role: "assistant", parts }
}

describe("pendingLabel", () => {
  const user: UIMessage = {
    id: "u1",
    role: "user",
    parts: [{ type: "text", content: "hola" }],
  }

  it("is null when idle", () => {
    expect(pendingLabel(user, false)).toBeNull()
  })

  it("shows typing until the first token arrives", () => {
    expect(pendingLabel(user, true)).toBe(TYPING_LABEL)
    const streaming = assistant([{ type: "text", content: "Hola" }])
    expect(pendingLabel(streaming, true)).toBeNull()
  })

  it("shows the running tool instead of typing", () => {
    const message = assistant([
      { type: "text", content: "Un momento" },
      {
        type: "tool-call",
        id: "c1",
        name: "current_datetime",
        arguments: "{}",
        state: "input-complete",
      },
    ])
    expect(pendingLabel(message, true)).toBe("Consultando la fecha…")
  })
})
