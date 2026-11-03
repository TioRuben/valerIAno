import { toolDefinition } from "@tanstack/ai"
import type { AnyServerTool } from "@tanstack/ai"
import { z } from "zod"
import {
  addToDate,
  dateDifference,
  dateOrNow,
  describeDate,
  toDuration,
} from "./date-math"
import type { DateDifference, DateResult } from "./date-math"
import type { ToolError } from "./truncate"

// The OpenAI adapter sends strict schemas, so optional fields arrive as null.
const DATE_HINT = 'YYYY-MM-DD, YYYY-MM-DDTHH:mm (local time) or "now"'
const amount = z.number().int().min(-100_000).max(100_000).nullish()
const dateInput = z.string().max(20)
const INVALID_DATE: ToolError = { error: `Invalid date, use ${DATE_HINT}` }

const currentDatetime = toolDefinition({
  name: "current_datetime",
  description: "Get the user's current date, time and time zone.",
  inputSchema: z.object({}),
})

const addToDateDefinition = toolDefinition({
  name: "add_to_date",
  description:
    "Add or subtract (negative) years, months, weeks, days, hours or minutes to a date.",
  inputSchema: z.object({
    date: dateInput.nullish().describe(`${DATE_HINT}; default now`),
    years: amount,
    months: amount,
    weeks: amount,
    days: amount,
    hours: amount,
    minutes: amount,
  }),
})

const dateDifferenceDefinition = toolDefinition({
  name: "date_difference",
  description: "Time between two dates (days, hours and years/months/days).",
  inputSchema: z.object({
    from: dateInput.describe(DATE_HINT),
    to: dateInput.nullish().describe("Same format; default now"),
  }),
})

export interface TimeZoneResult extends DateResult {
  timeZone: string
}

export function createDateTools(timeZone: string): Array<AnyServerTool> {
  return [
    currentDatetime.server((): TimeZoneResult => ({
      ...describeDate(new Date(), timeZone),
      timeZone,
    })),
    addToDateDefinition.server(
      ({ date, ...amounts }): DateResult | ToolError => {
        const start = dateOrNow(date, timeZone)
        if (!start) return INVALID_DATE
        return addToDate(start, toDuration(amounts), timeZone)
      }
    ),
    dateDifferenceDefinition.server(
      ({ from, to }): DateDifference | ToolError => {
        const start = dateOrNow(from, timeZone)
        const end = dateOrNow(to, timeZone)
        if (!start || !end) return INVALID_DATE
        return dateDifference(start, end, timeZone)
      }
    ),
  ]
}
