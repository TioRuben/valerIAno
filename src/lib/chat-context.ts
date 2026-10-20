import type { UIMessage } from "@tanstack/ai-react"

export const CONTEXT_TOKENS = 8192
export const INPUT_BUDGET_TOKENS = 5500
const CHARS_PER_TOKEN = 3
const PER_MESSAGE_OVERHEAD = 8

export function messageText(message: UIMessage): string {
  return message.parts
    .map((part) => (part.type === "text" ? part.content : ""))
    .join("")
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN)
}

function messageTokens(message: UIMessage): number {
  return estimateTokens(messageText(message)) + PER_MESSAGE_OVERHEAD
}

// Keeps the newest messages that fit the budget (the last one is always kept),
// dropping the oldest first, and never starting on an assistant message.
export function compactMessages(
  messages: ReadonlyArray<UIMessage>,
  systemPrompt: string,
  budget: number = INPUT_BUDGET_TOKENS
): Array<UIMessage> {
  let remaining = budget - estimateTokens(systemPrompt)
  const kept: Array<UIMessage> = []
  for (const message of [...messages].reverse()) {
    remaining -= messageTokens(message)
    if (kept.length > 0 && remaining < 0) break
    kept.unshift(message)
  }
  while (kept.length > 1 && kept[0].role !== "user") kept.shift()
  return kept
}
