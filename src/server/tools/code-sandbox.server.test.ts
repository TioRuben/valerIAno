import { describe, expect, it } from "vitest"
import { SANDBOX_LIMITS, runJavaScript } from "./code-sandbox.server"
import { TRUNCATION_MARK } from "./truncate"

describe("runJavaScript", () => {
  it("captures console output and the last expression", async () => {
    const result = await runJavaScript("console.log('a', 1 + 1); ({ n: 3 })")
    expect(result).toEqual({ output: 'a 2\n{"n":3}' })
  })

  it("reports exceptions with the output so far", async () => {
    const result = await runJavaScript(
      "console.log('before'); throw new Error('boom')"
    )
    expect(result).toEqual({ output: "before", error: "boom" })
  })

  it("has no network, module or process access", async () => {
    const result = await runJavaScript(
      "[typeof fetch, typeof require, typeof process, typeof setTimeout].join()"
    )
    expect(result.output).toBe("undefined,undefined,undefined,undefined")
  })

  it("stops infinite loops at the deadline", async () => {
    const started = Date.now()
    const result = await runJavaScript("while (true) {}")
    expect(result.error).toMatch(/interrupted/i)
    expect(Date.now() - started).toBeLessThan(SANDBOX_LIMITS.timeoutMs + 2000)
  }, 10_000)

  it("fails when exceeding the memory limit", async () => {
    const result = await runJavaScript(
      "const a = []; while (true) a.push('x'.repeat(1e6) + a.length)"
    )
    expect(result.error).toBeDefined()
  }, 10_000)

  it("truncates long output", async () => {
    const result = await runJavaScript("'y'.repeat(5000)")
    expect(result.output).toHaveLength(SANDBOX_LIMITS.outputChars)
    expect(result.output.endsWith(TRUNCATION_MARK)).toBe(true)
  })

  it("bounds console output from runaway loops", async () => {
    const result = await runJavaScript("for (;;) console.log('spam')")
    expect(result.output.length).toBeLessThanOrEqual(SANDBOX_LIMITS.outputChars)
    expect(result.error).toMatch(/interrupted/i)
  }, 10_000)

  it("keeps the event loop free and caps concurrent runs", async () => {
    let ticks = 0
    const interval = setInterval(() => (ticks += 1), 100)
    const runs = [
      runJavaScript("while (true) {}"),
      runJavaScript("while (true) {}"),
    ]
    const third = await runJavaScript("1")
    await Promise.all(runs)
    clearInterval(interval)
    expect(third.error).toMatch(/busy/i)
    expect(ticks).toBeGreaterThan(30)
  }, 15_000)
})
