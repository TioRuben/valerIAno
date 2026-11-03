import type { Source } from "@/lib/tool-parts"
import { Separator } from "@/components/ui/separator"

export function MessageSources({
  sources,
}: {
  sources: ReadonlyArray<Source>
}): React.JSX.Element {
  return (
    <nav aria-label="Fuentes" className="mt-2 flex flex-col gap-1">
      <Separator />
      <p className="text-sm text-muted-foreground">Fuentes</p>
      <ul className="flex flex-col gap-1 text-sm">
        {sources.map((source) => (
          <li key={source.url} className="truncate">
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              {source.title || source.url}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
