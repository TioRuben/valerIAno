import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/$token")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { handleRedeem } = await import("@/server/redeem-handler.server")
        return handleRedeem(request, params.token)
      },
    },
  },
})
