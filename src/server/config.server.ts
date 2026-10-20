import { z } from "zod"

const envSchema = z.object({
  ADMIN_PASSWORD_HASH: z
    .string()
    .regex(
      /^\$2[aby]\$\d{2}\$.{53}$/,
      "ADMIN_PASSWORD_HASH must be a bcrypt hash (htpasswd -B). Generate it with `pnpm hash-password <password>`, and escape each $ as \\$ in .env"
    ),
  JWT_SECRET: z.string().min(32),
  DATABASE_PATH: z.string().default("./data/valeriano.sqlite"),
  APP_URL: z.string().url().optional(),
})

export type AppConfig = z.infer<typeof envSchema>

export function getConfig(): AppConfig {
  return envSchema.parse({
    ...process.env,
    APP_URL: process.env.APP_URL || undefined,
  })
}
