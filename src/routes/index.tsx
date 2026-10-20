import { useEffect, useState } from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import {
  SPLASH_SEEN_KEY,
  SplashScreen,
} from "@/components/splash/splash-screen"
import { getSplashData } from "@/server/onboarding-fns"

export const Route = createFileRoute("/")({
  loader: () => getSplashData(),
  component: Index,
})

function Index(): React.JSX.Element {
  const { authed, slides } = Route.useLoaderData()
  const navigate = useNavigate()
  const [seen, setSeen] = useState<boolean | null>(null)

  useEffect(() => {
    const flag = localStorage.getItem(SPLASH_SEEN_KEY) === "1"
    setSeen(flag)
    if (authed && flag) void navigate({ to: "/chat", replace: true })
  }, [authed, navigate])

  if (!authed) {
    return (
      <main className="flex min-h-svh items-center justify-center p-6 text-center">
        <div className="space-y-2">
          <h1 className="font-heading text-4xl font-semibold">Valeriano</h1>
          <p className="text-muted-foreground">
            Este enlace no es válido o ha caducado.
          </p>
        </div>
      </main>
    )
  }
  if (seen !== false) return <main className="h-svh bg-background" />
  return (
    <SplashScreen
      slides={slides}
      onFinish={() => {
        localStorage.setItem(SPLASH_SEEN_KEY, "1")
        void navigate({ to: "/chat" })
      }}
    />
  )
}
