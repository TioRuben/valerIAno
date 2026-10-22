import type { UIMessage } from "@tanstack/ai-react"

const KEY = "valeriano.chat"

function parseChat(raw: string | null): Array<UIMessage> {
  const parsed: unknown = JSON.parse(raw ?? "[]")
  return Array.isArray(parsed) ? (parsed as Array<UIMessage>) : []
}

export function loadChat(): Array<UIMessage> {
  try {
    return parseChat(window.localStorage.getItem(KEY))
  } catch {
    return []
  }
}

export function saveChat(messages: ReadonlyArray<UIMessage>): void {
  try {
    if (messages.length === 0) window.localStorage.removeItem(KEY)
    else window.localStorage.setItem(KEY, JSON.stringify(messages))
  } catch {
    // Storage unavailable or full: the chat simply isn't persisted.
  }
}

export function clearChat(): void {
  window.localStorage.removeItem(KEY)
}
