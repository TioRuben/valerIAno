import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"

export type AdminData = {
  baseUrl: string
  prompt: string
  slides: Array<string>
  tokens: Array<{
    token: string
    maxAuthTokens: number
    createdAt: number
    issued: number
    used: number
    oldestInactiveAt: number | null
  }>
}

export const getAdminData = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminData | null> => {
    const { hasAdminSession } = await import("./admin-auth.server")
    if (!(await hasAdminSession())) return null
    const { getRequest } = await import("@tanstack/react-start/server")
    const { getConfig } = await import("./config.server")
    const { getDb } = await import("./db.server")
    const { readSystemPrompt } = await import("./system-prompt.server")
    const { listRegistrationTokens } =
      await import("./registration-tokens.server")
    const { readSlides } = await import("./splash-slides.server")
    const db = getDb()
    return {
      baseUrl: getConfig().APP_URL ?? new URL(getRequest().url).origin,
      prompt: readSystemPrompt(db),
      slides: readSlides(db),
      tokens: listRegistrationTokens(db),
    }
  }
)

export const loginAdmin = createServerFn({ method: "POST" })
  .validator(z.object({ password: z.string().min(1).max(200) }))
  .handler(async ({ data }): Promise<void> => {
    const { loginAdmin: login } = await import("./admin-auth.server")
    await login(data.password)
  })

export const logoutAdmin = createServerFn({ method: "POST" }).handler(
  async (): Promise<void> => {
    const { logoutAdmin: logout } = await import("./admin-auth.server")
    logout()
  }
)

export const saveSystemPrompt = createServerFn({ method: "POST" })
  .validator(z.object({ prompt: z.string().max(4000) }))
  .handler(async ({ data }): Promise<void> => {
    const { requireAdmin } = await import("./admin-auth.server")
    await requireAdmin()
    const { getDb } = await import("./db.server")
    const { writeSystemPrompt } = await import("./system-prompt.server")
    writeSystemPrompt(getDb(), data.prompt)
  })

export const saveSlides = createServerFn({ method: "POST" })
  .validator(z.object({ slides: z.array(z.string().max(1000)).length(4) }))
  .handler(async ({ data }): Promise<void> => {
    const { requireAdmin } = await import("./admin-auth.server")
    await requireAdmin()
    const { getDb } = await import("./db.server")
    const { writeSlides } = await import("./splash-slides.server")
    writeSlides(getDb(), data.slides)
  })

export const createToken = createServerFn({ method: "POST" })
  .validator(z.object({ maxAuthTokens: z.number().int().min(1).max(50) }))
  .handler(async ({ data }): Promise<string> => {
    const { requireAdmin } = await import("./admin-auth.server")
    await requireAdmin()
    const { getDb } = await import("./db.server")
    const { createRegistrationToken } =
      await import("./registration-tokens.server")
    return createRegistrationToken(getDb(), data.maxAuthTokens)
  })

export const deleteToken = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().length(8) }))
  .handler(async ({ data }): Promise<void> => {
    const { requireAdmin } = await import("./admin-auth.server")
    await requireAdmin()
    const { getDb } = await import("./db.server")
    const { deleteRegistrationToken } =
      await import("./registration-tokens.server")
    deleteRegistrationToken(getDb(), data.token)
  })
