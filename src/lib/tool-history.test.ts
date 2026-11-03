import { describe, expect, it } from "vitest"
import type { ModelMessage } from "@tanstack/ai"
import { stripPastToolMessages } from "./tool-history"

const call = {
  id: "c1",
  type: "function" as const,
  function: { name: "web_search", arguments: '{"query":"x"}' },
}

describe("stripPastToolMessages", () => {
  it("drops earlier tool calls and results but keeps replies", () => {
    const messages: Array<ModelMessage> = [
      { role: "user", content: "busca" },
      { role: "assistant", content: null, toolCalls: [call] },
      { role: "tool", content: '{"results":[]}', toolCallId: "c1" },
      { role: "assistant", content: "Respuesta", toolCalls: [call] },
      { role: "user", content: "gracias" },
    ]
    expect(stripPastToolMessages(messages)).toEqual([
      { role: "user", content: "busca" },
      { role: "assistant", content: "Respuesta" },
      { role: "user", content: "gracias" },
    ])
  })

  it("keeps the current turn's tool exchange", () => {
    const messages: Array<ModelMessage> = [
      { role: "user", content: "hora" },
      { role: "assistant", content: null, toolCalls: [call] },
      { role: "tool", content: "{}", toolCallId: "c1" },
    ]
    expect(stripPastToolMessages(messages)).toEqual(messages)
  })
})
