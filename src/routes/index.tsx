import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/")({ component: App })

function App(): React.JSX.Element {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <section className="max-w-xl space-y-4 text-center">
        <p className="font-heading text-sm tracking-[0.3em] text-primary uppercase">
          Te espera una conversación
        </p>
        <h1 className="font-heading text-5xl font-semibold tracking-tight">
          Valeriano
        </h1>
        <p className="text-muted-foreground">
          La introducción y el chat estarán disponibles próximamente.
        </p>
      </section>
    </main>
  )
}
