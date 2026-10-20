import {
  deleteCookie,
  getCookie,
  getRequestIP,
  setCookie,
  setResponseStatus,
} from "@tanstack/react-start/server"
import { getConfig } from "./config.server"
import {
  ADMIN_COOKIE,
  ADMIN_TOKEN_TTL_SECONDS,
  isAdminToken,
  signAdminToken,
  verifyPassword,
} from "./admin-jwt.server"
import { createRateLimiter } from "./rate-limiter.server"

const limiter = createRateLimiter(5, 15 * 60 * 1000)
const GENERIC_ERROR = "No se pudo iniciar sesión."

function clientIp(): string {
  return (
    getRequestIP({ xForwardedFor: process.env.TRUST_PROXY === "true" }) ??
    "unknown"
  )
}

function reject(status: 401 | 429, ip: string): Error {
  setResponseStatus(status)
  console.warn(`admin-auth-failure ip=${ip}`)
  return new Error(GENERIC_ERROR)
}

export async function requireAdmin(): Promise<void> {
  if (await isAdminToken(getCookie(ADMIN_COOKIE), getConfig().JWT_SECRET))
    return
  throw reject(401, clientIp())
}

export async function loginAdmin(password: string): Promise<void> {
  const ip = clientIp()
  const config = getConfig()
  if (limiter.isBlocked(ip)) throw reject(429, ip)
  if (!(await verifyPassword(password, config.ADMIN_PASSWORD_HASH))) {
    limiter.recordFailure(ip)
    throw reject(401, ip)
  }
  limiter.reset(ip)
  setCookie(ADMIN_COOKIE, await signAdminToken(config.JWT_SECRET), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_TOKEN_TTL_SECONDS,
  })
}

export function logoutAdmin(): void {
  deleteCookie(ADMIN_COOKIE, { path: "/" })
}

export function hasAdminSession(): Promise<boolean> {
  return isAdminToken(getCookie(ADMIN_COOKIE), getConfig().JWT_SECRET)
}
