import {
  chat,
  chatParamsFromRequestBody,
  convertMessagesToModelMessages,
  maxIterations,
  toServerSentEventsResponse,
} from "@tanstack/ai"
import type { ModelMessage } from "@tanstack/ai"
import type Database from "better-sqlite3"
import { createOpenaiChatCompletions } from "@tanstack/ai-openai"
import { getDb } from "./db.server"
import { AUTH_COOKIE, isValidAuthSecret } from "./auth-sessions.server"
import { readCookie } from "./redeem-handler.server"
import { readSystemPrompt } from "./system-prompt.server"
import { MAX_MODEL_TURNS, createModelTools } from "./tools/index.server"
import { resolveTimeZone } from "./tools/time-zone"
import { buildSystemPrompts } from "./tools/date-prompt"
import { compactMessages, modelMessageText } from "@/lib/chat-context"
import { stripPastToolMessages } from "@/lib/tool-history"

interface ChatRequest {
  messages: Array<ModelMessage>
  timeZone: string
}

const MAX_BODY_BYTES = 200_000
const DEFAULT_BASE_URL = "http://127.0.0.1:8080/v1"

function json(status: number, error: string): Response {
  return Response.json({ error }, { status })
}

// Client-sent tools in the AG-UI body are ignored; only server tools run.
async function readChatRequest(request: Request): Promise<ChatRequest | null> {
  const raw = await request.text()
  if (raw.length > MAX_BODY_BYTES) return null
  try {
    const params = await chatParamsFromRequestBody(JSON.parse(raw))
    return {
      messages: convertMessagesToModelMessages(params.messages),
      timeZone: resolveTimeZone(params.forwardedProps.timeZone),
    }
  } catch {
    return null
  }
}

function hasMessages(
  chatRequest: ChatRequest | null
): chatRequest is ChatRequest {
  return Boolean(chatRequest?.messages.length)
}

function streamReply(
  db: Database.Database,
  { messages, timeZone }: ChatRequest
): Response {
  const systemPrompts = buildSystemPrompts(
    readSystemPrompt(db),
    timeZone,
    new Date()
  )
  const adapter = createOpenaiChatCompletions("gpt-4o", "not-needed", {
    baseURL: process.env.LLAMA_CPP_BASE_URL || DEFAULT_BASE_URL,
  })
  const abortController = new AbortController()
  const stream = chat({
    adapter,
    messages: compactMessages(
      stripPastToolMessages(messages),
      systemPrompts.join("\n"),
      modelMessageText
    ),
    systemPrompts,
    tools: createModelTools(timeZone),
    agentLoopStrategy: maxIterations(MAX_MODEL_TURNS),
    abortController,
  })
  return toServerSentEventsResponse(stream, { abortController })
}

export async function handleChat(request: Request): Promise<Response> {
  const db = getDb()
  const secret = readCookie(request.headers.get("cookie"), AUTH_COOKIE)
  if (!isValidAuthSecret(db, secret)) return json(401, "No autorizado")

  const chatRequest = await readChatRequest(request)
  if (!hasMessages(chatRequest)) return json(400, "Solicitud no válida")
  return streamReply(db, chatRequest)
}
