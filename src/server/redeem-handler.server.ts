import { getDb } from "./db.server"
import { AUTH_COOKIE, redeemRegistrationToken } from "./auth-sessions.server"
import type { RedeemResult } from "./auth-sessions.server"
import { createRateLimiter } from "./rate-limiter.server"

const limiter = createRateLimiter(5, 15 * 60 * 1000)
const TOKEN_PATTERN = /^[A-Za-z0-9\-_.~]{8}$/
const TEN_YEARS_SECONDS = 10 * 365 * 24 * 60 * 60

const INVALID_HTML = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Valeriano</title></head><body style="margin:0;min-height:100svh;display:grid;place-items:center;font-family:system-ui,sans-serif;text-align:center"><main><h1>Valeriano</h1><p>Este enlace no es válido o ha caducado.</p></main></body></html>`

export function readCookie(
  header: string | null,
  name: string
): string | undefined {
  const pair = (header ?? "")
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
  return pair?.slice(name.length + 1)
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  return process.env.TRUST_PROXY === "true" && forwarded
    ? forwarded.split(",")[0].trim()
    : "unknown"
}

function authCookie(secret: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : ""
  return `${AUTH_COOKIE}=${secret}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${TEN_YEARS_SECONDS}${secure}`
}

function rejection(status: 401 | 429, ip: string): Response {
  console.warn(`redeem-failure ip=${ip}`)
  return new Response(INVALID_HTML, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  })
}

function evaluateToken(
  token: string,
  existing: string | undefined
): RedeemResult {
  if (!TOKEN_PATTERN.test(token)) return { status: "invalid" }
  return redeemRegistrationToken(getDb(), token, existing)
}

function successResponse(result: RedeemResult): Response {
  const headers = new Headers({ Location: "/" })
  if (result.status === "created") {
    headers.append("Set-Cookie", authCookie(result.secret))
  }
  return new Response(null, { status: 302, headers })
}

export function handleRedeem(request: Request, token: string): Response {
  const ip = clientIp(request)
  if (limiter.isBlocked(ip)) return rejection(429, ip)
  const existing = readCookie(request.headers.get("cookie"), AUTH_COOKIE)
  const result = evaluateToken(token, existing)
  if (result.status === "invalid") {
    limiter.recordFailure(ip)
    return rejection(401, ip)
  }
  return successResponse(result)
}
