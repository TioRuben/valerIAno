import { createServerFn } from "@tanstack/react-start"

export type SplashData = { authed: boolean; slides: Array<string> }

export const getSplashData = createServerFn({ method: "GET" }).handler(
  async (): Promise<SplashData> => {
    const { getRequest } = await import("@tanstack/react-start/server")
    const { getDb } = await import("./db.server")
    const { AUTH_COOKIE, isValidAuthSecret } =
      await import("./auth-sessions.server")
    const { readCookie } = await import("./redeem-handler.server")
    const { readSlides } = await import("./splash-slides.server")
    const secret = readCookie(getRequest().headers.get("cookie"), AUTH_COOKIE)
    const db = getDb()
    const authed = isValidAuthSecret(db, secret)
    return { authed, slides: authed ? readSlides(db) : [] }
  }
)
