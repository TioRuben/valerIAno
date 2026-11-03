import { describeDate } from "./date-math"

// A short line so the model knows "today" without a tool call (~20 tokens).
export function currentDatePrompt(timeZone: string, now: Date): string {
  const { text } = describeDate(now, timeZone)
  return `Fecha y hora actuales del usuario: ${text} (${timeZone}).`
}

export function buildSystemPrompts(
  systemPrompt: string,
  timeZone: string,
  now: Date
): Array<string> {
  const datePrompt = currentDatePrompt(timeZone, now)
  return systemPrompt ? [systemPrompt, datePrompt] : [datePrompt]
}
