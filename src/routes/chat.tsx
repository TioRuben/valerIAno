import { createFileRoute, redirect } from "@tanstack/react-router"
import { getSplashData } from "@/server/onboarding-fns"
import { ChatView } from "@/components/chat/chat-view"

export const Route = createFileRoute("/chat")({
  beforeLoad: async () => {
    const { authed } = await getSplashData()
    if (!authed) throw redirect({ to: "/" })
  },
  component: ChatView,
})
