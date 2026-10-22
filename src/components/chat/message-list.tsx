import { ChatMessage } from "./chat-message"
import { TypingIndicator } from "./typing-indicator"
import type { UIMessage } from "@tanstack/ai-react"
import type { RefObject } from "react"

interface MessageListProps {
  messages: ReadonlyArray<UIMessage>
  awaitingReply: boolean
  hasError: boolean
  endRef: RefObject<HTMLDivElement | null>
}

export function MessageList({
  messages,
  awaitingReply,
  hasError,
  endRef,
}: MessageListProps): React.JSX.Element {
  return (
    <div
      className="mx-auto flex max-w-3xl flex-col gap-3 p-4"
      role="log"
      aria-live="polite"
    >
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}
      {awaitingReply ? <TypingIndicator /> : null}
      {hasError ? (
        <p role="alert" className="text-base text-destructive">
          No se pudo obtener respuesta. Inténtalo de nuevo.
        </p>
      ) : null}
      <div ref={endRef} />
    </div>
  )
}
