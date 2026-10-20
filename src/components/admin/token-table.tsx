import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CopyButton } from "./copy-button"
import { deleteToken } from "@/server/admin-fns"
import type { AdminData } from "@/server/admin-fns"

const formatDate = (ms: number | null): string =>
  ms === null ? "—" : new Date(ms).toLocaleString("es-ES")

export function TokenTable({
  tokens,
  baseUrl,
  onChanged,
}: {
  tokens: AdminData["tokens"]
  baseUrl: string
  onChanged: () => void
}): React.JSX.Element {
  const remove = async (token: string): Promise<void> => {
    await deleteToken({ data: { token } })
    onChanged()
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Token</TableHead>
          <TableHead>Emitidos</TableHead>
          <TableHead>Usados</TableHead>
          <TableHead>Más antiguo sin actividad</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tokens.map((t) => (
          <TableRow key={t.token}>
            <TableCell className="font-mono">{t.token}</TableCell>
            <TableCell>
              {t.issued}/{t.maxAuthTokens}
            </TableCell>
            <TableCell>{t.used}</TableCell>
            <TableCell>{formatDate(t.oldestInactiveAt)}</TableCell>
            <TableCell className="flex gap-2">
              <CopyButton
                text={`${baseUrl}/${t.token}`}
                label={`Copiar el enlace del token ${t.token}`}
              />
              <Button
                variant="destructive"
                size="sm"
                onClick={() => remove(t.token)}
              >
                Eliminar
              </Button>
            </TableCell>
          </TableRow>
        ))}
        {tokens.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="text-muted-foreground">
              Todavía no hay tokens de registro.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
