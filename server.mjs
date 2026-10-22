import { serve } from "srvx/node"
import { staticMiddleware } from "srvx/static"
import server from "./dist/server/server.js"

serve({
  port: Number(process.env.PORT ?? 3000),
  hostname: process.env.HOST ?? "0.0.0.0",
  middleware: [staticMiddleware({ dir: "./dist/client" })],
  fetch: (request) => server.fetch(request),
})
