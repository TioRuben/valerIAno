import bcrypt from "bcryptjs"

const password = process.argv[2]
if (!password) {
  console.error("Usage: pnpm hash-password <password>")
  process.exit(1)
}

const hash = (await bcrypt.hash(password, 12)).replace(/^\$2b\$/, "$2y$")
console.log(`ADMIN_PASSWORD_HASH=${hash.replaceAll("$", "\\$")}`)
