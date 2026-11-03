// Worker thread entry: runs one piece of untrusted JavaScript in QuickJS and
// posts a single CodeResult back. Only package imports here: in dev Node runs
// this file directly with type stripping (see sandboxWorkerPlugin).
import { parentPort, workerData } from "node:worker_threads"
import { getQuickJS, shouldInterruptAfterDeadline } from "quickjs-emscripten"
import type { QuickJSContext, QuickJSHandle } from "quickjs-emscripten"
import { z } from "zod"

const workerInputSchema = z.object({
  code: z.string(),
  limits: z.object({
    timeoutMs: z.number(),
    memoryBytes: z.number(),
    stackBytes: z.number(),
    outputChars: z.number(),
  }),
})

export type WorkerInput = z.infer<typeof workerInputSchema>

interface WorkerResult {
  output: string
  error?: string
}

interface Output {
  lines: Array<string>
  push: (line: string) => void
}

const CONSOLE_METHODS = ["log", "info", "warn", "error"] as const
const errorSchema = z.object({ message: z.string() })

function stringify(value: unknown): string {
  if (typeof value === "string") return value
  try {
    return String(JSON.stringify(value))
  } catch {
    return String(value)
  }
}

// Stops collecting once the limit is passed; the host truncates exactly.
function createOutput(maxChars: number): Output {
  const lines: Array<string> = []
  let size = 0
  const push = (line: string): void => {
    if (size > maxChars) return
    lines.push(line)
    size += line.length + 1
  }
  return { lines, push }
}

function installConsole(vm: QuickJSContext, output: Output): void {
  const consoleHandle = vm.newObject()
  for (const method of CONSOLE_METHODS) {
    const fn = vm.newFunction(method, (...args: Array<QuickJSHandle>) => {
      output.push(args.map((arg) => stringify(vm.dump(arg))).join(" "))
    })
    vm.setProp(consoleHandle, method, fn)
    fn.dispose()
  }
  vm.setProp(vm.global, "console", consoleHandle)
  consoleHandle.dispose()
}

function errorMessage(value: unknown): string {
  const parsed = errorSchema.safeParse(value)
  return parsed.success ? parsed.data.message : stringify(value)
}

function evaluate(
  vm: QuickJSContext,
  code: string,
  output: Output
): string | undefined {
  const result = vm.evalCode(code, "main.js")
  if (result.error) {
    const error = errorMessage(vm.dump(result.error))
    result.error.dispose()
    return error
  }
  const value: unknown = vm.dump(result.value)
  result.value.dispose()
  if (value !== undefined) output.push(stringify(value))
  return undefined
}

async function run({ code, limits }: WorkerInput): Promise<WorkerResult> {
  const QuickJS = await getQuickJS()
  const runtime = QuickJS.newRuntime()
  runtime.setMemoryLimit(limits.memoryBytes)
  runtime.setMaxStackSize(limits.stackBytes)
  runtime.setInterruptHandler(
    shouldInterruptAfterDeadline(Date.now() + limits.timeoutMs)
  )
  const vm = runtime.newContext()
  const output = createOutput(limits.outputChars)
  try {
    installConsole(vm, output)
    const error = evaluate(vm, code, output)
    const text = output.lines.join("\n")
    return error ? { output: text, error } : { output: text }
  } finally {
    vm.dispose()
    runtime.dispose()
  }
}

void run(workerInputSchema.parse(workerData)).then((result) => {
  parentPort?.postMessage(result)
})
