import { z } from "zod"
import type { UIMessage } from "@tanstack/ai-react"
import { messageText } from "@/lib/chat-context"

type MessagePart = UIMessage["parts"][number]

export interface Source {
  title: string
  url: string
}

export const TYPING_LABEL = "Valeriano está escribiendo…"
const FALLBACK_TOOL_LABEL = "Consultando…"

const TOOL_LABELS: Record<string, string> = {
  web_search: "Buscando en la web…",
  current_datetime: "Consultando la fecha…",
  add_to_date: "Consultando la fecha…",
  date_difference: "Consultando la fecha…",
  run_javascript: "Ejecutando código…",
}

const searchOutputSchema = z.object({
  results: z.array(z.object({ title: z.string(), url: z.url() })),
})

function parseOutput(output: unknown): unknown {
  if (typeof output !== "string") return output
  try {
    return JSON.parse(output)
  } catch {
    return null
  }
}

function finishedCallIds(message: UIMessage): Set<string> {
  const ids = message.parts.flatMap((part) =>
    part.type === "tool-result" ? [part.toolCallId] : []
  )
  return new Set(ids)
}

function isPendingCall(done: Set<string>): (part: MessagePart) => boolean {
  return (part) =>
    part.type === "tool-call" && part.output === undefined && !done.has(part.id)
}

function toolLabel(name: string): string {
  return TOOL_LABELS[name] ?? FALLBACK_TOOL_LABEL
}

function labelOf(part: MessagePart | undefined): string | null {
  return part?.type === "tool-call" ? toolLabel(part.name) : null
}

// Label of the tool call still waiting for its result, if any.
export function runningToolLabel(
  message: UIMessage | undefined
): string | null {
  if (message?.role !== "assistant") return null
  return labelOf(message.parts.find(isPendingCall(finishedCallIds(message))))
}

function assistantText(last: UIMessage | undefined): string {
  return last?.role === "assistant" ? messageText(last) : ""
}

function typingLabel(last: UIMessage | undefined): string | null {
  return assistantText(last) ? null : TYPING_LABEL
}

// Progress text shown while a reply is in flight: the running tool, or
// "typing" until the first token arrives.
export function pendingLabel(
  last: UIMessage | undefined,
  isLoading: boolean
): string | null {
  if (!isLoading) return null
  return runningToolLabel(last) ?? typingLabel(last)
}

function searchSources(output: unknown): Array<Source> {
  const parsed = searchOutputSchema.safeParse(parseOutput(output))
  return parsed.success ? parsed.data.results : []
}

// Web search results returned to this message's tool calls.
export function messageSources(message: UIMessage): Array<Source> {
  return message.parts.flatMap((part) =>
    part.type === "tool-call" && part.name === "web_search"
      ? searchSources(part.output)
      : []
  )
}
