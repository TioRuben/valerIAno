import { describe, expect, it } from "vitest"
import type { UIMessage } from "@tanstack/ai-react"
import { messageSources, runningToolLabel } from "./tool-parts"

function assistant(parts: UIMessage["parts"]): UIMessage {
  return { id: "m1", role: "assistant", parts }
}

const searchOutput = {
  results: [
    { title: "A", url: "https://a.test", snippet: "" },
    { title: "A again", url: "https://a.test", snippet: "" },
    { title: "B", url: "https://b.test", snippet: "" },
  ],
}

describe("runningToolLabel", () => {
  it("labels a tool call that has no result yet", () => {
    const message = assistant([
      {
        type: "tool-call",
        id: "c1",
        name: "web_search",
        arguments: "{}",
        state: "input-complete",
      },
    ])
    expect(runningToolLabel(message)).toBe("Buscando en la web…")
  })

  it("returns null once the call has a result", () => {
    const message = assistant([
      {
        type: "tool-call",
        id: "c1",
        name: "run_javascript",
        arguments: "{}",
        state: "input-complete",
      },
      {
        type: "tool-result",
        toolCallId: "c1",
        content: "{}",
        state: "complete",
      },
    ])
    expect(runningToolLabel(message)).toBeNull()
    expect(runningToolLabel(undefined)).toBeNull()
  })
})

describe("messageSources", () => {
  it("collects web search results", () => {
    const message = assistant([
      {
        type: "tool-call",
        id: "c1",
        name: "web_search",
        arguments: "{}",
        state: "input-complete",
        output: searchOutput,
      },
    ])
    expect(messageSources(message).map((source) => source.url)).toEqual([
      "https://a.test",
      "https://a.test",
      "https://b.test",
    ])
  })

  it("ignores other tools and malformed output", () => {
    const message = assistant([
      {
        type: "tool-call",
        id: "c1",
        name: "run_javascript",
        arguments: "{}",
        state: "input-complete",
        output: searchOutput,
      },
      {
        type: "tool-call",
        id: "c2",
        name: "web_search",
        arguments: "{}",
        state: "input-complete",
        output: "not json",
      },
    ])
    expect(messageSources(message)).toEqual([])
  })
})
