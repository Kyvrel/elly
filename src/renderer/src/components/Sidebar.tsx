import { SidebarProps } from '@renderer/App'

export default function Sidebar({ threads, activeId, onSelect, onNewChat }: SidebarProps) {
  return (
    <div className="flex flex-col gap-4 w-64 bg-gray-50 p-4">
      <button
        className="bg-blue-500 hover:bg-blue-600 rounded-md shadow-sm p-2  text-white"
        onClick={onNewChat}
      >
        + New Chat
      </button>
      <div className="flex flex-col flex-1 mt-4">
        {threads.map((thread) => (
          <div
            key={thread.id}
            className={`p-2 rounded hover:bg-gray-200 cursor-pointer text-sm text-gray-700 ${
              thread.id === activeId ? 'bg-gray-200' : ''
            }`}
            onClick={() => onSelect(thread.id)}
          >
            {thread.title}
          </div>
        ))}
      </div>
    </div>
  )
}
