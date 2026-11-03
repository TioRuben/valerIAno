import { toolDefinition } from "@tanstack/ai"
import { z } from "zod"
import { runJavaScript } from "./code-sandbox.server"

export const runJavaScriptTool = toolDefinition({
  name: "run_javascript",
  description:
    "Run JavaScript for exact calculations or data processing. No network, files or imports. Use console.log or end with an expression to return output (max 2000 chars, 5 s).",
  inputSchema: z.object({ code: z.string().min(1).max(4000) }),
}).server(({ code }) => runJavaScript(code))
