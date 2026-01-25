import { useEffect, useState } from 'react'
import { api } from './lib/api'

function App(): React.JSX.Element {
  const [messages, setMessages] = useState([
    { id: 1, role: 'ai', content: 'hello, how can i help you today' },
    { id: 2, role: 'user', content: 'show me the design' }
  ])
  const [threads, setThreads] = useState<any[]>([])
  useEffect(() => {
    const load = async () => {
      const data = await api.threads.getAll()
      console.log('threads: ', data)
      setThreads(data)
    }
    load()
  }, [])

  const [input, setInput] = useState('')

  const handleClick = () => {
    if (!input.trim()) return
    const newUserMsg = { id: Date.now(), role: 'user', content: input }
    setMessages([...messages, newUserMsg])
    setInput('')
  }
  return (
    <div className="flex h-screen bg-gray-50">
      {/* sidebar */}
      <div className="flex flex-col gap-4 w-64 bg-gray-50 p-4">
        <button className="bg-blue-500 hover:bg-blue-600 rounded-md shadow-sm p-2  text-white">
          + New Chat
        </button>
        <div className="flex flex-col flex-1 mt-4">
          {threads.map((thread) => (
            <div
              key={thread.id}
              className="p-2 rounded hover:bg-gray-200 cursor-pointer text-sm text-gray-700"
            >
              {thread.title}
            </div>
          ))}
        </div>
      </div>

      {/* chat area */}
      <div className="flex-1 flex flex-col h-full bg-white ">
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((message, _) => (
            <div
              key={`${message.id}`}
              className={`flex ${message.role == 'ai' ? 'justify-start' : 'justify-end'} `}
            >
              <div
                className={`${message.role == 'ai' ? ' bg-gray-100 text-gray-800' : 'bg-blue-500 text-white'} max-w-[80%] rounded-lg p-3`}
              >
                {message.content}
              </div>
            </div>
          ))}
        </div>
        <div className="h-16 p-4 flex justify-between gap-2 border-t border-t-gray-100">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key == 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleClick()
              }
            }}
            placeholder="input your question"
            className="px-2 py-1 w-full border border-gray-300 rounded-md"
          />
          <button
            className="bg-blue-500 hover:bg-blue-600 rounded-md shadow-sm text-white px-2 py-1"
            onClick={handleClick}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
