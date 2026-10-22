import type { UIMessage } from "@tanstack/ai-react"
import { Markdown } from "./markdown"
import { messageText } from "@/lib/chat-context"
import { cn } from "@/lib/utils"

type Kind = "user" | "assistant"

const ROW: Record<Kind, string> = {
  user: "justify-end",
  assistant: "justify-start",
}

const BUBBLE: Record<Kind, string> = {
  user: "bg-primary text-primary-foreground",
  assistant: "bg-card text-card-foreground ring-1 ring-foreground/10",
}

function Body({ kind, text }: { kind: Kind; text: string }): React.JSX.Element {
  if (kind === "user") {
    return <p className="text-base whitespace-pre-wrap">{text}</p>
  }
  return <Markdown>{text}</Markdown>
}

export function ChatMessage({
  message,
}: {
  message: UIMessage
}): React.JSX.Element | null {
  const text = messageText(message)
  if (!text) return null
  const kind: Kind = message.role === "user" ? "user" : "assistant"
  return (
    <div className={cn("flex", ROW[kind])}>
      <div className={cn("max-w-[85%] px-3 py-2", BUBBLE[kind])}>
        <Body kind={kind} text={text} />
      </div>
    </div>
  )
}
