import { describe, expect, it } from "vitest"
import type { UIMessage } from "@tanstack/ai-react"
import { compactMessages } from "./chat-context"

function msg(id: number, role: "user" | "assistant", size: number): UIMessage {
  return {
    id: String(id),
    role,
    parts: [{ type: "text", content: "x".repeat(size) }],
  }
}

describe("compactMessages", () => {
  it("keeps everything when it fits", () => {
    const all = [msg(1, "user", 30), msg(2, "assistant", 30)]
    expect(compactMessages(all, "sys", 1000)).toHaveLength(2)
  })

  it("drops the oldest messages first and starts on a user message", () => {
    const all = [
      msg(1, "user", 300),
      msg(2, "assistant", 300),
      msg(3, "user", 300),
      msg(4, "assistant", 300),
      msg(5, "user", 30),
    ]
    const kept = compactMessages(all, "", 150)
    expect(kept.map((m) => m.id)).toEqual(["5"])
  })

  it("always keeps the latest message even if it exceeds the budget", () => {
    const kept = compactMessages([msg(1, "user", 9000)], "sys", 100)
    expect(kept).toHaveLength(1)
  })

  it("accounts for the system prompt", () => {
    const all = [
      msg(1, "user", 30),
      msg(2, "assistant", 30),
      msg(3, "user", 30),
    ]
    const kept = compactMessages(all, "s".repeat(600), 230)
    expect(kept.map((m) => m.id)).toEqual(["3"])
  })
})
