import { posix } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import type { Plugin } from "vite"

const VIRTUAL_ID = "virtual:sandbox-worker"
const RESOLVED_ID = `\0${VIRTUAL_ID}`
const WORKER_FILE = "sandbox-worker.js"
const PLACEHOLDER = "__VALERIANO_SANDBOX_WORKER__"
const WORKER_SOURCE = fileURLToPath(
  new URL("../src/server/tools/sandbox-worker.ts", import.meta.url)
)

function devModule(): string {
  return `export default ${JSON.stringify(pathToFileURL(WORKER_SOURCE).href)}`
}

function buildModule(): string {
  return `export default new URL("${PLACEHOLDER}", import.meta.url).href`
}

// Path from the chunk that imports the virtual module to the worker chunk.
function relativeWorkerPath(chunkFileName: string): string {
  const relative = posix.relative(posix.dirname(chunkFileName), WORKER_FILE)
  return relative.startsWith(".") ? relative : `./${relative}`
}

// Vite only bundles `new URL(..., import.meta.url)` assets for the client, so
// the worker is emitted here as its own server chunk. `virtual:sandbox-worker`
// exports its file URL; in dev and tests that is the `.ts` source, which Node
// runs with type stripping.
export function sandboxWorkerPlugin(): Plugin {
  let isBuild = false
  return {
    name: "valeriano:sandbox-worker",
    applyToEnvironment: (environment): boolean =>
      environment.config.consumer === "server",
    configResolved(config): void {
      isBuild = config.command === "build"
    },
    resolveId(id): string | null {
      return id === VIRTUAL_ID ? RESOLVED_ID : null
    },
    load(id): string | null {
      if (id !== RESOLVED_ID) return null
      if (!isBuild) return devModule()
      this.emitFile({ type: "chunk", id: WORKER_SOURCE, fileName: WORKER_FILE })
      return buildModule()
    },
    renderChunk(code, chunk): { code: string; map: null } | null {
      if (!code.includes(PLACEHOLDER)) return null
      const path = relativeWorkerPath(chunk.fileName)
      return { code: code.replaceAll(PLACEHOLDER, path), map: null }
    },
  }
}
