import type { ModelMessage } from "@tanstack/ai"

function lastUserIndex(messages: ReadonlyArray<ModelMessage>): number {
  const fromEnd = [...messages]
    .reverse()
    .findIndex((message) => message.role === "user")
  return fromEnd === -1 ? -1 : messages.length - 1 - fromEnd
}

function hasContent(message: ModelMessage): boolean {
  const { content } = message
  return typeof content === "string"
    ? content.length > 0
    : Boolean(content?.length)
}

function withoutToolCalls({
  toolCalls: _dropped,
  ...rest
}: ModelMessage): ModelMessage {
  return rest
}

// Removes tool calls and tool results from turns before the latest user
// message, so earlier tool output is never resent to the model.
export function stripPastToolMessages(
  messages: ReadonlyArray<ModelMessage>
): Array<ModelMessage> {
  const boundary = lastUserIndex(messages)
  const past = messages
    .slice(0, Math.max(boundary, 0))
    .filter((message) => message.role !== "tool")
    .map(withoutToolCalls)
    .filter(hasContent)
  return [...past, ...messages.slice(Math.max(boundary, 0))]
}
