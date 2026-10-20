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
import { saveSlides } from "@/server/admin-fns"

const MAX_LENGTH = 1000

export function SplashSlidesSection({
  initial,
}: {
  initial: Array<string>
}): React.JSX.Element {
  const [slides, setSlides] = useState<Array<string>>(initial)
  const [status, setStatus] = useState<string>("")

  const save = async (): Promise<void> => {
    try {
      await saveSlides({ data: { slides } })
      setStatus("Guardado")
    } catch {
      setStatus("No se pudo guardar.")
    }
  }

  const update = (index: number, value: string): void => {
    setSlides(slides.map((s, i) => (i === index ? value : s)))
    setStatus("")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Introducción</CardTitle>
        <CardDescription>
          Textos de las {slides.length} diapositivas que se muestran al empezar.
          Texto plano; los saltos de línea se respetan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {slides.map((slide, index) => (
          <div key={index} className="space-y-1">
            <Textarea
              aria-label={`Diapositiva ${index + 1}`}
              className="min-h-28"
              maxLength={MAX_LENGTH}
              value={slide}
              onChange={(e) => update(index, e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Diapositiva {index + 1} · {slide.length}/{MAX_LENGTH}
            </p>
          </div>
        ))}
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
