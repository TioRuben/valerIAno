import { chat, toServerSentEventsResponse } from "@tanstack/ai"
import { createOpenaiChatCompletions } from "@tanstack/ai-openai"
import type { UIMessage } from "@tanstack/ai"
import { z } from "zod"
import { getDb } from "./db.server"
import { AUTH_COOKIE, isValidAuthSecret } from "./auth-sessions.server"
import { readCookie } from "./redeem-handler.server"
import { readSystemPrompt } from "./system-prompt.server"
import { compactMessages } from "@/lib/chat-context"

const MAX_BODY_BYTES = 200_000
const MAX_MESSAGES = 200
const DEFAULT_BASE_URL = "http://127.0.0.1:8080/v1"

const bodySchema = z.object({
  messages: z.array(z.object({ role: z.string() }).loose()).max(MAX_MESSAGES),
})

function json(status: number, error: string): Response {
  return Response.json({ error }, { status })
}

async function readMessages(
  request: Request
): Promise<Array<UIMessage> | null> {
  const raw = await request.text()
  if (raw.length > MAX_BODY_BYTES) return null
  try {
    const parsed = bodySchema.safeParse(JSON.parse(raw))
    return parsed.success
      ? (parsed.data.messages as unknown as Array<UIMessage>)
      : null
  } catch {
    return null
  }
}

export async function handleChat(request: Request): Promise<Response> {
  const db = getDb()
  const secret = readCookie(request.headers.get("cookie"), AUTH_COOKIE)
  if (!isValidAuthSecret(db, secret)) return json(401, "No autorizado")

  const messages = await readMessages(request)
  if (!messages?.length) return json(400, "Solicitud no válida")

  const systemPrompt = readSystemPrompt(db)
  const adapter = createOpenaiChatCompletions("gpt-4o", "not-needed", {
    baseURL: process.env.LLAMA_CPP_BASE_URL || DEFAULT_BASE_URL,
  })
  const abortController = new AbortController()
  const stream = chat({
    adapter,
    messages: compactMessages(messages, systemPrompt),
    systemPrompts: systemPrompt ? [systemPrompt] : [],
    abortController,
  })
  return toServerSentEventsResponse(stream, { abortController })
}
