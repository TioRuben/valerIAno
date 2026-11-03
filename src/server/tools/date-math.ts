import { TZDate, tz } from "@date-fns/tz"
import {
  add,
  differenceInCalendarDays,
  differenceInDays,
  differenceInHours,
  differenceInMonths,
  differenceInYears,
  formatISO,
} from "date-fns"
import type { Duration } from "date-fns"

const LOCAL_DATE = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/

export interface DateResult {
  iso: string
  text: string
}

export interface DateDifference {
  totalDays: number
  totalHours: number
  years: number
  months: number
  days: number
}

function isRealDate(date: TZDate, month: number, day: number): boolean {
  return date.getMonth() === month - 1 && date.getDate() === day
}

// Parses `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm` as wall-clock time in `timeZone`.
export function parseLocalDate(text: string, timeZone: string): TZDate | null {
  const match = LOCAL_DATE.exec(text.trim())
  if (!match) return null
  const [year, month, day, hours, minutes] = match
    .slice(1)
    .map((part: string | undefined) => Number(part ?? 0))
  const date = new TZDate(year, month - 1, day, hours, minutes, timeZone)
  return isRealDate(date, month, day) ? date : null
}

function isNow(text: string | null | undefined): boolean {
  return !text || text.trim().toLowerCase() === "now"
}

// Missing, empty or "now" means the current instant.
export function dateOrNow(
  text: string | null | undefined,
  timeZone: string
): Date | null {
  return isNow(text) ? new Date() : parseLocalDate(String(text), timeZone)
}

// Drops null/undefined amounts (strict tool schemas send null).
export function toDuration(
  amounts: Partial<Record<keyof Duration, number | null>>
): Duration {
  const entries = Object.entries(amounts).filter(
    (entry): entry is [string, number] => typeof entry[1] === "number"
  )
  return Object.fromEntries(entries)
}

export function describeDate(date: Date, timeZone: string): DateResult {
  const text = new Intl.DateTimeFormat("es-ES", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone,
  }).format(date)
  return { iso: formatISO(new TZDate(date, timeZone)), text }
}

export function addToDate(
  start: Date,
  amounts: Duration,
  timeZone: string
): DateResult {
  const result = add(start, amounts, { in: tz(timeZone) })
  return describeDate(result, timeZone)
}

export function dateDifference(
  from: Date,
  to: Date,
  timeZone: string
): DateDifference {
  const options = { in: tz(timeZone) }
  const years = differenceInYears(to, from, options)
  const afterYears = add(from, { years }, options)
  const months = differenceInMonths(to, afterYears, options)
  const afterMonths = add(afterYears, { months }, options)
  return {
    totalDays: differenceInCalendarDays(to, from, options),
    totalHours: differenceInHours(to, from),
    years,
    months,
    days: differenceInDays(to, afterMonths, options),
  }
}
