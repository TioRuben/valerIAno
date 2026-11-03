import { ChatMessage } from "./chat-message"
import { TypingIndicator } from "./typing-indicator"
import { turnSources } from "@/lib/turn-sources"
import type { UIMessage } from "@tanstack/ai-react"
import type { RefObject } from "react"

interface MessageListProps {
  messages: ReadonlyArray<UIMessage>
  pendingLabel: string | null
  hasError: boolean
  endRef: RefObject<HTMLDivElement | null>
}

export function MessageList({
  messages,
  pendingLabel,
  hasError,
  endRef,
}: MessageListProps): React.JSX.Element {
  return (
    <div
      className="mx-auto flex max-w-3xl flex-col gap-3 p-4"
      role="log"
      aria-live="polite"
    >
      {messages.map((message, index) => (
        <ChatMessage
          key={message.id}
          message={message}
          sources={turnSources(messages, index)}
        />
      ))}
      {pendingLabel ? <TypingIndicator label={pendingLabel} /> : null}
      {hasError ? (
        <p role="alert" className="text-base text-destructive">
          No se pudo obtener respuesta. Inténtalo de nuevo.
        </p>
      ) : null}
      <div ref={endRef} />
    </div>
  )
}
