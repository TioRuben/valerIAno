import type { UIMessage } from "@tanstack/ai-react"
import { Markdown } from "./markdown"
import { messageText } from "@/lib/chat-context"
import { cn } from "@/lib/utils"

export function ChatMessage({
  message,
}: {
  message: UIMessage
}): React.JSX.Element | null {
  const text = messageText(message)
  if (!text) return null
  const isUser = message.role === "user"
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] px-3 py-2",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-card text-card-foreground ring-1 ring-foreground/10"
        )}
      >
        {isUser ? (
          <p className="text-base whitespace-pre-wrap">{text}</p>
        ) : (
          <Markdown>{text}</Markdown>
        )}
      </div>
    </div>
  )
}
