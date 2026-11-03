import type { ModelMessage, UIMessage } from "@tanstack/ai"

export const CONTEXT_TOKENS = 8192
// Leaves room for tool definitions and tool results (specs/tools.md).
export const INPUT_BUDGET_TOKENS = 4500
const CHARS_PER_TOKEN = 3
const PER_MESSAGE_OVERHEAD = 8

export function messageText(message: UIMessage): string {
  return message.parts
    .map((part) => (part.type === "text" ? part.content : ""))
    .join("")
}

function contentText(content: ModelMessage["content"]): string {
  if (typeof content === "string") return content
  if (!content) return ""
  return content
    .map((part) => (part.type === "text" ? part.content : ""))
    .join("")
}

export function modelMessageText(message: ModelMessage): string {
  const calls = (message.toolCalls ?? [])
    .map((call) => call.function.name + call.function.arguments)
    .join("")
  return contentText(message.content) + calls
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN)
}

function dropLeadingNonUser<T extends { role: string }>(
  kept: Array<T>
): Array<T> {
  const firstUser = kept.findIndex((message) => message.role === "user")
  return kept.slice(firstUser === -1 ? kept.length - 1 : firstUser)
}

function fitsBudget(keptCount: number, remaining: number): boolean {
  return keptCount === 0 || remaining >= 0
}

function takeNewest<T>(
  messages: ReadonlyArray<T>,
  initialBudget: number,
  textOf: (message: T) => string
): Array<T> {
  let remaining = initialBudget
  const kept: Array<T> = []
  for (const message of [...messages].reverse()) {
    remaining -= estimateTokens(textOf(message)) + PER_MESSAGE_OVERHEAD
    if (!fitsBudget(kept.length, remaining)) break
    kept.unshift(message)
  }
  return kept
}

// Keeps the newest messages that fit the budget (the last one is always kept),
// dropping the oldest first, and never starting on an assistant message.
export function compactMessages<T extends { role: string }>(
  messages: ReadonlyArray<T>,
  systemPrompt: string,
  textOf: (message: T) => string,
  budget: number = INPUT_BUDGET_TOKENS
): Array<T> {
  const initial = budget - estimateTokens(systemPrompt)
  return dropLeadingNonUser(takeNewest(messages, initial, textOf))
}
