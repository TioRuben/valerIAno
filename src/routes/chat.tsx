import { createFileRoute, redirect } from "@tanstack/react-router"
import { getSplashData } from "@/server/onboarding-fns"

export const Route = createFileRoute("/chat")({
  beforeLoad: async () => {
    const { authed } = await getSplashData()
    if (!authed) throw redirect({ to: "/" })
  },
  component: Chat,
})

function Chat(): React.JSX.Element {
  return (
    <main className="flex min-h-svh items-center justify-center p-6 text-center">
      <p className="text-muted-foreground">
        El chat estará disponible próximamente.
      </p>
    </main>
  )
}
