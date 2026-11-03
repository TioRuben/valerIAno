import type { UIMessage } from "@tanstack/ai-react"
import { Markdown } from "./markdown"
import { MessageSources } from "./message-sources"
import { messageText } from "@/lib/chat-context"
import type { Source } from "@/lib/tool-parts"
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

interface BodyProps {
  kind: Kind
  text: string
  sources: ReadonlyArray<Source>
}

function Body({ kind, text, sources }: BodyProps): React.JSX.Element {
  if (kind === "user") {
    return <p className="text-base whitespace-pre-wrap">{text}</p>
  }
  return (
    <>
      <Markdown>{text}</Markdown>
      {sources.length > 0 ? <MessageSources sources={sources} /> : null}
    </>
  )
}

export function ChatMessage({
  message,
  sources,
}: {
  message: UIMessage
  sources: ReadonlyArray<Source>
}): React.JSX.Element | null {
  const text = messageText(message)
  if (!text) return null
  const kind: Kind = message.role === "user" ? "user" : "assistant"
  return (
    <div className={cn("flex", ROW[kind])}>
      <div className={cn("max-w-[85%] px-3 py-2", BUBBLE[kind])}>
        <Body kind={kind} text={text} sources={sources} />
      </div>
    </div>
  )
}
