import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { CopyButton } from "./copy-button"
import { createToken } from "@/server/admin-fns"

const MIN = 1
const MAX = 50
const clamp = (n: number): number => Math.min(MAX, Math.max(MIN, n))

export function TokenCreator({
  baseUrl,
  onCreated,
}: {
  baseUrl: string
  onCreated: () => void
}): React.JSX.Element {
  const [limit, setLimit] = useState<number>(10)
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const create = async (): Promise<void> => {
    try {
      const token = await createToken({ data: { maxAuthTokens: limit } })
      setUrl(`${baseUrl}/${token}`)
      setError(null)
      onCreated()
    } catch {
      setError("No se pudo crear el token.")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="limit">Usos permitidos</Label>
          <Slider
            id="limit"
            min={MIN}
            max={MAX}
            value={[limit]}
            onValueChange={(v) => setLimit(clamp(Array.isArray(v) ? v[0] : v))}
          />
        </div>
        <Input
          aria-label="Usos permitidos"
          type="number"
          min={MIN}
          max={MAX}
          className="w-20"
          value={limit}
          onChange={(e) => setLimit(clamp(Math.trunc(Number(e.target.value))))}
        />
        <Button onClick={create}>Crear token</Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {url && (
        <div className="flex flex-wrap items-center gap-2 bg-muted p-3">
          <code className="break-all">{url}</code>
          <CopyButton text={url} label="Copiar el enlace del nuevo token" />
        </div>
      )}
    </div>
  )
}
