import { ChatInputProps } from './ChatThread'

import { Field, FieldGroup } from '@/components/ui/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea
} from '@/components/ui/input-group'

export default function ChatInput({ onSend, input, onType }: ChatInputProps): React.JSX.Element {
  return (
    <FieldGroup className="sticky bottom-0 z-20 w-full shrink-0 border-t bg-background px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
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
