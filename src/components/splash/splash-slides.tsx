import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function SplashSlides({
  slides,
  onFinish,
  children,
}: {
  slides: Array<string>
  onFinish: () => void
  children?: React.ReactNode
}): React.JSX.Element {
  const track = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState<number>(0)
  const last = slides.length - 1

  const goTo = (target: number): void => {
    const el = track.current
    if (!el) return
    const next = Math.min(Math.max(target, 0), last)
    el.scrollTo({
      left: next * el.clientWidth,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    })
  }

  const onScroll = (): void => {
    const el = track.current
    if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth))
  }

  const onKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === "ArrowRight") goTo(index + 1)
    if (e.key === "ArrowLeft") goTo(index - 1)
  }

  return (
    <section
      aria-roledescription="carrusel"
      aria-label="Historia de Valeriano"
      className="flex min-h-0 w-full min-w-0 flex-col gap-4"
      onKeyDown={onKeyDown}
    >
      {children}
      <div
        ref={track}
        tabIndex={0}
        onScroll={onScroll}
        className="flex min-h-0 snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((text, i) => (
          <article
            key={i}
            aria-label={`${i + 1} de ${slides.length}`}
            className="min-w-0 shrink-0 basis-full snap-center overflow-y-auto px-1 text-base leading-relaxed [overflow-wrap:anywhere] whitespace-pre-line text-foreground"
          >
            {text}
          </article>
        ))}
      </div>
      <div className="flex shrink-0 flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            disabled={index === 0}
            onClick={() => goTo(index - 1)}
          >
            Atrás
          </Button>
          <div className="flex gap-2" aria-hidden="true">
            {slides.map((_, i) => (
              <span
                key={i}
                className={`size-2 rounded-full ${i === index ? "bg-primary" : "bg-muted-foreground/40"}`}
              />
            ))}
          </div>
          {index === last ? (
            <Button onClick={onFinish}>Chatear con Valeriano</Button>
          ) : (
            <Button onClick={() => goTo(index + 1)}>Siguiente</Button>
          )}
        </div>
      </div>
    </section>
  )
}
