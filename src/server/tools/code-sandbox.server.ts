import { Worker } from "node:worker_threads"
import workerUrl from "virtual:sandbox-worker"
import { z } from "zod"
import { truncateOutput } from "./truncate"
import type { WorkerInput } from "./sandbox-worker"

export const SANDBOX_LIMITS = {
  timeoutMs: 5000,
  memoryBytes: 32 * 1024 * 1024,
  stackBytes: 1024 * 1024,
  outputChars: 2000,
} as const

export interface CodeResult {
  output: string
  error?: string
}

const MAX_CONCURRENT_RUNS = 2
const KILL_GRACE_MS = 1000
const RESOURCE_LIMITS = {
  maxOldGenerationSizeMb: 64,
  maxYoungGenerationSizeMb: 16,
}
const BUSY: CodeResult = { output: "", error: "Sandbox busy, try again" }
const FAILURE: CodeResult = { output: "", error: "Sandbox failure" }
const KILLED: CodeResult = { output: "", error: "Time limit exceeded" }
const resultSchema = z.object({
  output: z.string(),
  error: z.string().optional(),
})
let activeRuns = 0

function toResult(message: unknown): CodeResult {
  const parsed = resultSchema.safeParse(message)
  if (!parsed.success) return FAILURE
  const output = truncateOutput(parsed.data.output, SANDBOX_LIMITS.outputChars)
  return { ...parsed.data, output }
}

function startWorker(code: string): Worker {
  const workerData: WorkerInput = { code, limits: SANDBOX_LIMITS }
  // Empty env: user code never runs next to the server's secrets.
  return new Worker(new URL(workerUrl), {
    workerData,
    env: {},
    resourceLimits: RESOURCE_LIMITS,
    stdout: true,
    stderr: true,
  })
}

// One worker per run; it is terminated as soon as it answers, or killed if it
// overruns the QuickJS deadline.
function runInWorker(code: string): Promise<CodeResult> {
  return new Promise((resolve) => {
    const worker = startWorker(code)
    const timer = setTimeout(
      () => finish(KILLED),
      SANDBOX_LIMITS.timeoutMs + KILL_GRACE_MS
    )
    function finish(result: CodeResult): void {
      clearTimeout(timer)
      worker.removeAllListeners()
      void worker.terminate()
      resolve(result)
    }
    worker.once("message", (message: unknown) => finish(toResult(message)))
    worker.once("error", () => finish(FAILURE))
    worker.once("exit", () => finish(FAILURE))
  })
}

// Runs untrusted JavaScript in a fresh QuickJS (WASM) context inside a worker
// thread, so the server's event loop never blocks on user code.
export async function runJavaScript(code: string): Promise<CodeResult> {
  if (activeRuns >= MAX_CONCURRENT_RUNS) return BUSY
  activeRuns += 1
  try {
    return await runInWorker(code)
  } catch {
    return FAILURE
  } finally {
    activeRuns -= 1
  }
}
