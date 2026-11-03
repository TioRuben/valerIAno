export interface ToolError {
  error: string
}

export const TRUNCATION_MARK = "…[truncated]"

// Trims whitespace and cuts text to `max` characters, marking the cut.
export function truncate(text: string, max: number): string {
  const clean = text.trim()
  if (clean.length <= max) return clean
  return clean.slice(0, Math.max(0, max - 1)).trimEnd() + "…"
}

export function truncateOutput(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max - TRUNCATION_MARK.length) + TRUNCATION_MARK
}
