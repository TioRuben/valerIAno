import { Spinner } from "@/components/ui/spinner"

export function TypingIndicator(): React.JSX.Element {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-2 bg-card px-3 py-2 text-base text-muted-foreground ring-1 ring-foreground/10">
        <Spinner aria-label="Valeriano está escribiendo" />
        <span className="animate-pulse">Valeriano está escribiendo…</span>
      </div>
    </div>
  )
}
