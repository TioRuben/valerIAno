import { SplashSlides } from "./splash-slides"

export const SPLASH_SEEN_KEY = "valeriano:splash-seen"

export function SplashScreen({
  slides,
  onFinish,
}: {
  slides: Array<string>
  onFinish: () => void
}): React.JSX.Element {
  return (
    <main
      className="flex h-svh flex-col justify-end overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: "url(/valeriano.webp)" }}
    >
      <div className="flex max-h-[70svh] min-h-0 w-full p-4">
        <div className="mx-auto flex max-h-full min-h-0 w-full max-w-2xl min-w-0 overflow-hidden rounded-2xl border border-border/50 bg-background/40 p-5 shadow-lg backdrop-blur-xl">
          <SplashSlides slides={slides} onFinish={onFinish}>
            <h1 className="text-center font-heading text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
              Valeriano
            </h1>
          </SplashSlides>
        </div>
      </div>
    </main>
  )
}
