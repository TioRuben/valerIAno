import type { UIMessage } from "@tanstack/ai-react"
import { messageSources } from "./tool-parts"
import type { Source } from "./tool-parts"

const MAX_SOURCES = 5

function isLastOfTurn(
  messages: ReadonlyArray<UIMessage>,
  index: number
): boolean {
  return messages[index + 1]?.role !== "assistant"
}

function turnStart(messages: ReadonlyArray<UIMessage>, index: number): number {
  let start = index
  while (start > 0 && messages[start - 1].role === "assistant") start -= 1
  return start
}

// TanStack AI splits a turn into several assistant messages (tool exchange,
// then the reply). Sources of the whole turn go under its last message.
export function turnSources(
  messages: ReadonlyArray<UIMessage>,
  index: number
): Array<Source> {
  if (!isLastOfTurn(messages, index)) return []
  const all = messages
    .slice(turnStart(messages, index), index + 1)
    .flatMap(messageSources)
  const unique = new Map(all.map((source) => [source.url, source]))
  return [...unique.values()].slice(0, MAX_SOURCES)
}
