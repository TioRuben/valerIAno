import { describe, expect, it } from "vitest"
import {
  addToDate,
  dateDifference,
  dateOrNow,
  describeDate,
  parseLocalDate,
  toDuration,
} from "./date-math"

const MADRID = "Europe/Madrid"

function local(text: string, zone: string = MADRID): Date {
  const date = parseLocalDate(text, zone)
  if (!date) throw new Error(`invalid ${text}`)
  return date
}

function utc(text: string): string {
  return new Date(local(text).getTime()).toISOString()
}

describe("parseLocalDate", () => {
  it("reads wall-clock time in the given zone", () => {
    expect(utc("2026-11-03T10:15")).toBe("2026-11-03T09:15:00.000Z")
    expect(utc("2026-07-01")).toBe("2026-06-30T22:00:00.000Z")
  })

  it("rejects malformed or impossible dates", () => {
    expect(parseLocalDate("03/11/2026", MADRID)).toBeNull()
    expect(parseLocalDate("2026-02-30", MADRID)).toBeNull()
  })
})

describe("describeDate", () => {
  it("formats in es-ES with the zone offset", () => {
    const result = describeDate(local("2026-11-03T10:15"), MADRID)
    expect(result.iso).toBe("2026-11-03T10:15:00+01:00")
    expect(result.text).toContain("martes, 3 de noviembre de 2026")
  })
})

describe("addToDate", () => {
  it("adds calendar units across a DST change", () => {
    const result = addToDate(local("2026-03-28T12:00"), { days: 1 }, MADRID)
    expect(result.iso).toBe("2026-03-29T12:00:00+02:00")
  })

  it("subtracts with negative amounts", () => {
    const result = addToDate(local("2026-01-31"), { months: -1 }, MADRID)
    expect(result.iso).toBe("2025-12-31T00:00:00+01:00")
  })
})

describe("dateDifference", () => {
  it("returns totals and a years/months/days breakdown", () => {
    const diff = dateDifference(
      local("2025-01-15"),
      local("2026-03-20"),
      MADRID
    )
    expect(diff).toMatchObject({ totalDays: 429, years: 1, months: 2, days: 5 })
  })

  it("is negative when the end is earlier", () => {
    const diff = dateDifference(
      local("2026-03-20"),
      local("2026-03-10"),
      MADRID
    )
    expect(diff).toMatchObject({ totalDays: -10, days: -10, totalHours: -240 })
  })
})

describe("dateOrNow", () => {
  it("treats missing, empty and 'now' as the current instant", () => {
    for (const text of [null, undefined, "", " Now "]) {
      expect(dateOrNow(text, MADRID)).toBeInstanceOf(Date)
    }
  })

  it("parses explicit dates and rejects garbage", () => {
    expect(dateOrNow("2026-12-25", MADRID)?.getTime()).toBe(
      local("2026-12-25").getTime()
    )
    expect(dateOrNow("tomorrow", MADRID)).toBeNull()
  })
})

describe("toDuration", () => {
  it("drops null amounts", () => {
    expect(toDuration({ days: 2, months: null, years: undefined })).toEqual({
      days: 2,
    })
  })
})
