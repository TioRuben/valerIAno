import { createFileRoute, useRouter } from "@tanstack/react-router"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { LoginForm } from "@/components/admin/login-form"
import { getAdminData, logoutAdmin } from "@/server/admin-fns"

export const Route = createFileRoute("/gestion")({
  loader: () => getAdminData(),
  headers: () => ({ "X-Robots-Tag": "noindex, nofollow" }),
  head: () => ({ meta: [{ name: "robots", content: "noindex" }] }),
  component: Gestion,
})

function Gestion(): React.JSX.Element {
  const data = Route.useLoaderData()
  const router = useRouter()
  const refresh = (): Promise<void> => router.invalidate()

  if (!data) return <LoginForm onSuccess={refresh} />
  return (
    <AdminDashboard
      data={data}
      onChanged={refresh}
      onLogout={async () => {
        await logoutAdmin()
        await refresh()
      }}
    />
  )
}
