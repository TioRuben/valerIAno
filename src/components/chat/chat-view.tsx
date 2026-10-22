import { useEffect, useRef, useState } from "react"
import { useChat } from "@tanstack/ai-react"
import { fetchServerSentEvents } from "@tanstack/ai-client"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon } from "@hugeicons/core-free-icons"
import { ChatInput } from "./chat-input"
import { MessageList } from "./message-list"
import { messageText } from "@/lib/chat-context"
import type { UIMessage } from "@tanstack/ai-react"
import { useVisibleHeight } from "@/lib/use-visible-height"
import { Button } from "@/components/ui/button"
import { clearChat, loadChat, saveChat } from "@/lib/chat-storage"

const connection = fetchServerSentEvents("/api/chat")

function lastAssistantText(last: UIMessage | undefined): string {
  if (last?.role !== "assistant") return ""
  return messageText(last)
}

export function ChatView(): React.JSX.Element {
  const { messages, sendMessage, setMessages, stop, isLoading, error } =
    useChat({ connection })
  const [hydrated, setHydrated] = useState<boolean>(false)
  const endRef = useRef<HTMLDivElement>(null)
  const visibleHeight = useVisibleHeight()
  const awaitingReply = isLoading && !lastAssistantText(messages.at(-1))

  useEffect(() => {
    setMessages(loadChat())
    setHydrated(true)
  }, [setMessages])

  useEffect(() => {
    if (hydrated && !isLoading) saveChat(messages)
  }, [hydrated, isLoading, messages])

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" })
  }, [messages, awaitingReply])

  function newChat(): void {
    stop()
    clearChat()
    setMessages([])
  }

  return (
    <main
      className="relative flex h-dvh flex-col overflow-hidden"
      style={{ height: visibleHeight }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[url('/valeriano.webp')] bg-cover bg-center opacity-10"
      />
      <header className="relative flex items-center justify-between border-b bg-background/70 px-4 py-2 backdrop-blur">
        <h1 className="font-heading text-xl">Valeriano</h1>
        <Button variant="outline" size="sm" onClick={newChat}>
          <HugeiconsIcon icon={Add01Icon} data-icon="inline-start" />
          Nuevo chat
        </Button>
      </header>
      <div className="relative flex-1 overflow-y-auto">
        <MessageList
          messages={messages}
          awaitingReply={awaitingReply}
          hasError={Boolean(error)}
          endRef={endRef}
        />
      </div>
      <div className="relative border-t bg-background/70 p-3 backdrop-blur">
        <div className="mx-auto max-w-3xl">
          <ChatInput
            isLoading={isLoading}
            onSend={(text) => void sendMessage(text)}
            onStop={stop}
          />
        </div>
      </div>
    </main>
  )
}
