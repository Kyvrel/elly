import { useEffect, useState } from 'react'
import { api } from './lib/api'
import Sidebar from './components/Sidebar'
import { ChatThread } from './components/ChatThread'
import { PermissionDialog } from './components/PermissionDialog'

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

  useEffect((): void => {
    const load = async (): Promise<void> => {
      const data = await api.threads.getAll()
      console.log('threads: ', data)
      setThreads(data)
    }
    load()
  }, [])

  const handleNewChat = async (): Promise<void> => {
    console.log('[handleNewChat]')
    const thread: any = await api.threads.create({
      title: 'new',
      model: 'google/gemini-2.5-flash'
    })
    console.log('[handleNewChat] thread: ', thread)
    setActiveThreadId(thread.id)
    setThreads((prev) => [thread, ...prev])
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <PermissionDialog />
      <Sidebar
        threads={threads}
        activeId={activeThreadId}
        onSelect={setActiveThreadId}
        onNewChat={handleNewChat}
      />

      <ChatThread threadId={activeThreadId} />
    </div>
  )
}

export default App
