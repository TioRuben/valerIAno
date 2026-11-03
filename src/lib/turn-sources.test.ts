import { describe, expect, it } from "vitest"
import type { UIMessage } from "@tanstack/ai-react"
import { turnSources } from "./turn-sources"

function search(id: string, urls: Array<string>): UIMessage {
  const results = urls.map((url) => ({ title: url, url, snippet: "" }))
  return {
    id,
    role: "assistant",
    parts: [
      {
        type: "tool-call",
        id: `c-${id}`,
        name: "web_search",
        arguments: "{}",
        state: "input-complete",
        output: { results },
      },
    ],
  }
}

function text(id: string, role: "user" | "assistant"): UIMessage {
  return { id, role, parts: [{ type: "text", content: id }] }
}

const conversation: Array<UIMessage> = [
  text("q1", "user"),
  search("s1", ["https://a.test", "https://b.test"]),
  search("s2", ["https://b.test", "https://c.test"]),
  text("r1", "assistant"),
  text("q2", "user"),
  text("r2", "assistant"),
]

describe("turnSources", () => {
  it("puts the turn's deduplicated sources on its last message", () => {
    expect(turnSources(conversation, 3).map((source) => source.url)).toEqual([
      "https://a.test",
      "https://b.test",
      "https://c.test",
    ])
  })

  it("shows nothing on earlier messages of the turn or other turns", () => {
    expect(turnSources(conversation, 1)).toEqual([])
    expect(turnSources(conversation, 5)).toEqual([])
    expect(turnSources(conversation, 0)).toEqual([])
  })

  it("caps the list at five sources", () => {
    const urls = Array.from({ length: 8 }, (_, i) => `https://${i}.test`)
    expect(turnSources([search("s", urls)], 0)).toHaveLength(5)
  })
})
