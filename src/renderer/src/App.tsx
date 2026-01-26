import { useEffect, useState } from 'react'
import { api } from './lib/api'
import Sidebar from './components/Sidebar'
import { ChatThread } from './components/ChatThread'

export interface SidebarProps {
  threads: any[]
  activeId: string
  onSelect: (id: string) => void
  onNewChat: () => void
}

export interface ChatThreadProps {
  threadId: string
}

function App(): React.JSX.Element {
  const [threads, setThreads] = useState<any[]>([])
  const [activeThreadId, setActiveThreadId] = useState('')

  useEffect(() => {
    const load = async () => {
      const data = await api.threads.getAll()
      console.log('threads: ', data)
      setThreads(data)
    }
    load()
  }, [])

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        threads={threads}
        activeId={activeThreadId}
        onSelect={setActiveThreadId}
        onNewChat={() => alert('New Chat here.')}
      />

      <ChatThread threadId={activeThreadId} />
    </div>
  )
}

export default App
