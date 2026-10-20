import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { SentIcon, StopIcon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

type ChatInputProps = {
  isLoading: boolean
  onSend: (text: string) => void
  onStop: () => void
}

export function ChatInput({
  isLoading,
  onSend,
  onStop,
}: ChatInputProps): React.JSX.Element {
  const [text, setText] = useState<string>("")

  function submit(): void {
    const value = text.trim()
    if (!value || isLoading) return
    onSend(value)
    setText("")
  }

  return (
    <form
      className="flex items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <Textarea
        value={text}
        placeholder="Escribe un mensaje…"
        aria-label="Mensaje"
        className="max-h-40 min-h-9 resize-none bg-background/80"
        rows={1}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault()
            submit()
          }
        }}
      />
      {isLoading ? (
        <Button type="button" size="icon" aria-label="Detener" onClick={onStop}>
          <HugeiconsIcon icon={StopIcon} />
        </Button>
      ) : (
        <Button
          type="submit"
          size="icon"
          aria-label="Enviar"
          disabled={!text.trim()}
        >
          <HugeiconsIcon icon={SentIcon} />
        </Button>
      )}
    </form>
  )
}
