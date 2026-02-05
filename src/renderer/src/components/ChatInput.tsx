import { Field, FieldGroup } from '@/components/ui/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea
} from '@/components/ui/input-group'

export interface ChatInputProps {
  onSend: () => void
  input: string
  onType: (input: string) => void
}

export default function ChatInput({ onSend, input, onType }: ChatInputProps): React.JSX.Element {
  return (
    <FieldGroup className="sticky bottom-0 z-20 w-full bg-background p-4">
      <Field>
        <InputGroup>
          <InputGroupTextarea
            id="block-end-textarea"
            value={input}
            onChange={(e) => onType(e.target.value)}
            onKeyDown={(e) => {
              if (e.key == 'Enter' && !e.shiftKey) {
                e.preventDefault()
                onSend()
              }
            }}
            placeholder="input your question"
          />
          <InputGroupAddon align="block-end">
            <InputGroupButton variant="default" size="sm" className="ml-auto" onClick={onSend}>
              Send
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </Field>
    </FieldGroup>
  )
}
