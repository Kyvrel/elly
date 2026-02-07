import { useEffect, useState } from 'react'
import { api } from './lib/api'
import { AppSidebar } from './components/AppSidebar'
import { ChatThread } from './components/ChatThread'
import { PermissionDialog } from './components/PermissionDialog'
import { SidebarProvider } from '@/components/ui/sidebar'
import { ChatThread as ChatThreadType } from 'src/shared/types'

function App(): React.JSX.Element {
  const [threads, setThreads] = useState<ChatThreadType[]>([])
  const [activeThreadId, setActiveThreadId] = useState('')

  useEffect((): void => {
    const load = async (): Promise<void> => {
      const data = await api.threads.getAll()
      setThreads(data)
      if (data.length > 0) {
        setActiveThreadId(data[data.length - 1].threadId)
      }
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
    <>
      <SidebarProvider>
        <PermissionDialog />
        <AppSidebar
          threads={threads}
          activeId={activeThreadId}
          onSelect={setActiveThreadId}
          onNewChat={handleNewChat}
        />
        <main className="flex-1 flex flex-col">
          <ChatThread threadId={activeThreadId} />
        </main>
      </SidebarProvider>
    </>
  )
}

export default App
