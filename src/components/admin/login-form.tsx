import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { loginAdmin } from "@/server/admin-fns"

export function LoginForm({
  onSuccess,
}: {
  onSuccess: () => void
}): React.JSX.Element {
  const [password, setPassword] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault()
    try {
      await loginAdmin({ data: { password } })
      onSuccess()
    } catch {
      setError("No se pudo iniciar sesión.")
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Administración</CardTitle>
          <CardDescription>
            Introduce la contraseña para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full">
              Acceder
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
