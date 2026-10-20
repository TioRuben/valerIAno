import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SystemPromptSection } from "./system-prompt-section"
import { TokenCreator } from "./token-creator"
import { TokenTable } from "./token-table"
import type { AdminData } from "@/server/admin-fns"

export function AdminDashboard({
  data,
  onChanged,
  onLogout,
}: {
  data: AdminData
  onChanged: () => void
  onLogout: () => void
}): React.JSX.Element {
  return (
    <main className="container mx-auto max-w-4xl space-y-6 p-4 pt-8">
      <header className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Administración</h1>
        <Button variant="outline" onClick={onLogout}>
          Cerrar sesión
        </Button>
      </header>
      <SystemPromptSection initial={data.prompt} />
      <Card>
        <CardHeader>
          <CardTitle>Tokens de registro</CardTitle>
          <CardDescription>
            Al eliminar un token, ya no se podrá canjear. Los tokens de acceso
            que ya se hayan emitido seguirán funcionando.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <TokenCreator baseUrl={data.baseUrl} onCreated={onChanged} />
          <TokenTable
            tokens={data.tokens}
            baseUrl={data.baseUrl}
            onChanged={onChanged}
          />
        </CardContent>
      </Card>
    </main>
  )
}
