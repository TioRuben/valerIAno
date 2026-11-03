import { z } from "zod"

export const DEFAULT_TIME_ZONE = "Europe/Madrid"

const timeZoneSchema = z.string().max(64)

// Accepts an IANA zone recognized by Intl; otherwise Europe/Madrid.
export function resolveTimeZone(value: unknown): string {
  const parsed = timeZoneSchema.safeParse(value)
  if (!parsed.success) return DEFAULT_TIME_ZONE
  try {
    return new Intl.DateTimeFormat("es-ES", {
      timeZone: parsed.data,
    }).resolvedOptions().timeZone
  } catch {
    return DEFAULT_TIME_ZONE
  }
}
