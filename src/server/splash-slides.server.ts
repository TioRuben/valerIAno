import type Database from "better-sqlite3"

export const SLIDE_COUNT = 4
export const MAX_SLIDE_LENGTH = 1000
const KEY = "splash_slides"

const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n\nUt enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."

export const DEFAULT_SLIDES: Array<string> = Array.from(
  { length: SLIDE_COUNT },
  () => LOREM
)

function isSlideList(parsed: unknown): parsed is Array<string> {
  return (
    Array.isArray(parsed) &&
    parsed.length === SLIDE_COUNT &&
    parsed.every((s) => typeof s === "string")
  )
}

function parseSlides(value: string): Array<string> | null {
  try {
    const parsed: unknown = JSON.parse(value)
    return isSlideList(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function readSlides(db: Database.Database): Array<string> {
  const row = db
    .prepare("SELECT value FROM settings WHERE key = ?")
    .get(KEY) as { value: string } | undefined
  return (row && parseSlides(row.value)) || DEFAULT_SLIDES
}

export function writeSlides(
  db: Database.Database,
  slides: Array<string>
): void {
  if (
    slides.length !== SLIDE_COUNT ||
    slides.some((s) => s.length > MAX_SLIDE_LENGTH)
  ) {
    throw new Error("Las diapositivas no son válidas.")
  }
  db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).run(KEY, JSON.stringify(slides))
}
