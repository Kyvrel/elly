import { Plus, MessageSquare } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'

interface AppSidebarProps {
  threads: any[]
  activeId: string
  onSelect: (id: string) => void
  onNewChat: () => void
}

export function AppSidebar({ threads, activeId, onSelect, onNewChat }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="p-2">
          <Button onClick={onNewChat} className="w-full">
            <Plus className="h-4 w-4" />
            <span className="ml-2">New Chat</span>
          </Button>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Conversations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {threads.map((thread) => (
                <SidebarMenuItem key={thread.id}>
                  <SidebarMenuButton
                    isActive={thread.id === activeId}
                    onClick={() => onSelect(thread.id)}
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span className="truncate">{thread.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
