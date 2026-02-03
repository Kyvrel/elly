import { ChatInputProps } from './ChatThread'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function ChatInput({ onSend, input, onType }: ChatInputProps): React.JSX.Element {
  return (
    <div className="h-16 p-4 flex justify-between gap-2 border-t border-t-gray-100">
      <Input
        type="text"
        value={input}
        onChange={(e) => onType(e.target.value)}
        onKeyDown={(e) => {
          if (e.key == 'Enter' && !e.shiftKey) {
            e.preventDefault()
            onSend()
          }
        }}
        placeholder="input your question"
        className="px-2 py-1 w-full border border-gray-300 rounded-md"
      />
      <Button
        className="bg-blue-500 hover:bg-blue-600 rounded-md shadow-sm text-white px-2 py-1"
        onClick={onSend}
      >
        Send
      </Button>
    </div>
  )
}
