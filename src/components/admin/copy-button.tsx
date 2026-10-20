import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"

export function CopyButton({
  text,
  label,
}: {
  text: string
  label: string
}): React.JSX.Element {
  const [copied, setCopied] = useState<boolean>(false)

  const copy = async (): Promise<void> => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Button variant="outline" size="sm" onClick={copy} aria-label={label}>
      <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} />
      {copied ? "Copiado" : "Copiar"}
    </Button>
  )
}
