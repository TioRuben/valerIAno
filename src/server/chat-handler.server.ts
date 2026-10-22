import {
  chat,
  chatParamsFromRequestBody,
  convertMessagesToModelMessages,
  toServerSentEventsResponse,
} from "@tanstack/ai"
import type { ModelMessage } from "@tanstack/ai"
import type Database from "better-sqlite3"
import { createOpenaiChatCompletions } from "@tanstack/ai-openai"
import { getDb } from "./db.server"
import { AUTH_COOKIE, isValidAuthSecret } from "./auth-sessions.server"
import { readCookie } from "./redeem-handler.server"
import { readSystemPrompt } from "./system-prompt.server"
import { compactMessages, modelMessageText } from "@/lib/chat-context"

const MAX_BODY_BYTES = 200_000
const DEFAULT_BASE_URL = "http://127.0.0.1:8080/v1"

function json(status: number, error: string): Response {
  return Response.json({ error }, { status })
}

async function readMessages(
  request: Request
): Promise<Array<ModelMessage> | null> {
  const raw = await request.text()
  if (raw.length > MAX_BODY_BYTES) return null
  try {
    const params = await chatParamsFromRequestBody(JSON.parse(raw))
    return convertMessagesToModelMessages(params.messages)
  } catch {
    return null
  }
}

function hasMessages(
  messages: Array<ModelMessage> | null
): messages is Array<ModelMessage> {
  return messages !== null && messages.length > 0
}

function streamReply(
  db: Database.Database,
  messages: Array<ModelMessage>
): Response {
  const systemPrompt = readSystemPrompt(db)
  const adapter = createOpenaiChatCompletions("gpt-4o", "not-needed", {
    baseURL: process.env.LLAMA_CPP_BASE_URL || DEFAULT_BASE_URL,
  })
  const abortController = new AbortController()
  const stream = chat({
    adapter,
    messages: compactMessages(messages, systemPrompt, modelMessageText),
    systemPrompts: systemPrompt ? [systemPrompt] : [],
    abortController,
  })
  return toServerSentEventsResponse(stream, { abortController })
}

export async function handleChat(request: Request): Promise<Response> {
  const db = getDb()
  const secret = readCookie(request.headers.get("cookie"), AUTH_COOKIE)
  if (!isValidAuthSecret(db, secret)) return json(401, "No autorizado")

  const messages = await readMessages(request)
  if (!hasMessages(messages)) return json(400, "Solicitud no válida")
  return streamReply(db, messages)
}
