import type { UIMessagePart, UIDataTypes, UITools } from 'ai'

export const formatMessages = (
  messages: any[]
): Array<{
  id: string | number
  role: string
  content: string
}> => {
  return messages.map((item) => {
    const content = item.message.parts
      .filter((part: UIMessagePart<UIDataTypes, UITools>) => part.type == 'text')
      .map((part: UIMessagePart<UIDataTypes, UITools>) => part.text)
      .join('')
    return {
      id: item.message.id,
      role: item.message.role,
      content
    }
  })
}
