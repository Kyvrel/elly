import { useEffect, useRef, useState } from 'react'
import { api } from '.././lib/api'
import { ChatThreadProps } from '@renderer/App'
import ChatInput from './ChatInput'
import type { UIMessagePart, UIDataTypes, UITools } from 'ai'

export interface ChatInputProps {
  onSend: () => void
  input: string
  onType: (input: string) => void
}

export const formatMessages = (messages) => {
  return messages.map((item) => {
    const content = item.message.parts
      .filter((part) => part.type == 'text')
      .map((part) => part.text)
      .join('')
    return {
      id: item.message.id,
      role: item.message.role,
      content
    }
  })
}

export function ChatThread({ threadId }: ChatThreadProps) {
  const [streamingContent, setStreamingContent] = useState('')
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)

  const [messages, setMessages] = useState<Array<{
    id: string | number
    role: string
    content: string
  }>>([])

  const isAssistant = (role: string) => role === 'assistant' || role === 'ai'
  useEffect(() => {
    if (!threadId) return
    const load = async () => {
      const data = await api.messages.getByThread(threadId)
      const formattedMsgs = formatMessages(data)
      setMessages(formattedMsgs)
    }
    load()
  }, [threadId])

  const handleClick = async () => {
    if (!input.trim()) return
    if (!threadId) {
      alert('please select a chat')
      return
    }
    const newUserMsg = { id: Date.now(), role: 'user', content: input }
    setMessages([...messages, newUserMsg])
    setInput('')
    setIsAtBottom(true)

    await api.messages.send({
      threadId: threadId,
      message: input,
      model: 'google/gemini-2.5-flash'
    })

    const data = await api.messages.getByThread(threadId)
    setMessages(formatMessages(data))
  }

  useEffect(() => {
    if (!threadId) return

    const ws = new WebSocket('ws://localhost:8765')

    ws.onopen = () => {
      console.log('connected to ws')
      ws.send(JSON.stringify({ type: 'register', threadId: threadId }))
    }

    ws.onmessage = (event) => {
      console.log('ws onMessage data:', event.data)
      const data = JSON.parse(event.data)

      if (data.type === 'message_update') {
        // Extract text from parts array
        const textContent = data.parts
          .filter((part: UIMessagePart<UIDataTypes, UITools>) => part.type === 'text')
          .map((part: UIMessagePart<UIDataTypes, UITools>) => part.type === 'text' ? part.text : '')
          .join('')

        setStreamingContent(textContent)
      } else if (data.type === 'done') {
        setStreamingContent('')
        api.messages.getByThread(threadId).then((d) => setMessages(formatMessages(d)))
      }
    }
    return () => ws.close()
  }, [threadId])

  useEffect(() => {
    if (isAtBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length, streamingContent, isAtBottom])

  const handleScroll = () => {
    if (!scrollContainerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
    const isBottom = scrollHeight - scrollTop - clientHeight < 50
    setIsAtBottom(isBottom)
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white ">
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 p-4 overflow-y-auto space-y-4"
      >
        {messages.map((message, _) => (
          <div
            key={`${message.id}`}
            className={`flex ${isAssistant(message.role) ? 'justify-start' : 'justify-end'} `}
          >
            <div
              className={`${isAssistant(message.role) ? ' bg-gray-100 text-gray-800' : 'bg-blue-500 text-white'} max-w-[80%] rounded-lg p-3`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {streamingContent && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800  max-w-[80%] rounded-lg p-3">
              {streamingContent}
            </div>
          </div>
        )}
        <div ref={messagesEndRef}></div>
      </div>
      <ChatInput onSend={handleClick} input={input} onType={setInput} />
    </div>
  )
}
