import { useEffect, useState } from 'react'
import { api } from './lib/api'
import { AppSidebar } from './components/AppSidebar'
import { ChatThread } from './components/ChatThread'
import { PermissionDialog } from './components/PermissionDialog'
import { SidebarProvider } from '@/components/ui/sidebar'

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
