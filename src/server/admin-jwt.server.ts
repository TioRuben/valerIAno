import bcrypt from "bcryptjs"
import { SignJWT, jwtVerify } from "jose"

export const ADMIN_COOKIE = "valeriano_admin"
export const ADMIN_TOKEN_TTL_SECONDS = 60 * 60 * 24

const encode = (secret: string): Uint8Array => new TextEncoder().encode(secret)

export function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  // htpasswd emits $2y$, which bcryptjs does not recognise; it is equivalent to $2a$.
  return bcrypt.compare(password, hash.replace(/^\$2y\$/, "$2a$"))
}

export function signAdminToken(secret: string): Promise<string> {
  return new SignJWT({ admin: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_TOKEN_TTL_SECONDS}s`)
    .sign(encode(secret))
}

export async function isAdminToken(
  token: string | undefined,
  secret: string
): Promise<boolean> {
  if (!token) return false
  try {
    const { payload } = await jwtVerify(token, encode(secret), {
      algorithms: ["HS256"],
    })
    return payload.admin === true
  } catch {
    return false
  }
}
