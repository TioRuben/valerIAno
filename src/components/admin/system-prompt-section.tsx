import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { saveSystemPrompt } from "@/server/admin-fns"

const MAX_LENGTH = 4000

export function SystemPromptSection({
  initial,
}: {
  initial: string
}): React.JSX.Element {
  const [prompt, setPrompt] = useState<string>(initial)
  const [status, setStatus] = useState<string>("")

  const save = async (): Promise<void> => {
    try {
      await saveSystemPrompt({ data: { prompt } })
      setStatus("Guardado")
    } catch {
      setStatus("No se pudo guardar.")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Instrucciones del sistema</CardTitle>
        <CardDescription>
          {prompt.length}/{MAX_LENGTH} caracteres
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          aria-label="Instrucciones del sistema"
          className="min-h-48"
          maxLength={MAX_LENGTH}
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value)
            setStatus("")
          }}
        />
        <div className="flex items-center gap-3">
          <Button onClick={save}>Guardar</Button>
          <span role="status" className="text-sm text-muted-foreground">
            {status}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
