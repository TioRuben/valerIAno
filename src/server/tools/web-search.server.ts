import { toolDefinition } from "@tanstack/ai"
import { z } from "zod"
import { truncate } from "./truncate"
import type { ToolError } from "./truncate"

const MAX_RESULTS = 5
const TITLE_CHARS = 120
const SNIPPET_CHARS = 200
const TIMEOUT_MS = 8000
const DEFAULT_SEARXNG_URL = "http://127.0.0.1:8888"

export interface SearchResult {
  title: string
  url: string
  snippet: string
}

export interface SearchOutput {
  results: Array<SearchResult>
}

const searxngSchema = z.object({
  results: z.array(
    z.object({
      title: z.string().default(""),
      url: z.string(),
      content: z.string().nullish(),
    })
  ),
})

function isWebUrl(url: string): boolean {
  return /^https?:\/\//i.test(url)
}

export function toSearchResults(body: unknown): Array<SearchResult> {
  const parsed = searxngSchema.safeParse(body)
  if (!parsed.success) return []
  return parsed.data.results
    .filter((result) => isWebUrl(result.url))
    .slice(0, MAX_RESULTS)
    .map((result) => ({
      title: truncate(result.title, TITLE_CHARS),
      url: result.url,
      snippet: truncate(result.content ?? "", SNIPPET_CHARS),
    }))
}

function searchUrl(query: string): URL {
  const url = new URL("/search", process.env.SEARXNG_URL || DEFAULT_SEARXNG_URL)
  url.searchParams.set("q", query)
  url.searchParams.set("format", "json")
  return url
}

async function searchSearxng(query: string): Promise<SearchOutput | ToolError> {
  try {
    const response = await fetch(searchUrl(query), {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (!response.ok) return { error: "Search service unavailable" }
    return { results: toSearchResults(await response.json()) }
  } catch {
    return { error: "Search failed or timed out" }
  }
}

export const webSearchTool = toolDefinition({
  name: "web_search",
  description:
    "Search the web for current or factual information. Returns titles, URLs and snippets. Never include personal data in the query.",
  inputSchema: z.object({ query: z.string().min(1).max(200) }),
}).server(({ query }) => searchSearxng(query))
