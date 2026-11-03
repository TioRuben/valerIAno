import type { AnyServerTool } from "@tanstack/ai"
import { runJavaScriptTool } from "./code-tool.server"
import { createDateTools } from "./date-tools.server"
import { webSearchTool } from "./web-search.server"

export const MAX_MODEL_TURNS = 4

// The only tools exposed to the model (see specs/tools.md).
export function createModelTools(timeZone: string): Array<AnyServerTool> {
  return [webSearchTool, ...createDateTools(timeZone), runJavaScriptTool]
}
