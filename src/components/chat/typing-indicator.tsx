import { Spinner } from "@/components/ui/spinner"

export function TypingIndicator({
  label,
}: {
  label: string
}): React.JSX.Element {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-2 bg-card px-3 py-2 text-base text-muted-foreground ring-1 ring-foreground/10">
        <Spinner aria-hidden />
        <span className="animate-pulse">{label}</span>
      </div>
    </div>
  )
}
