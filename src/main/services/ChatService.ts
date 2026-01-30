import WebSocket from 'ws'
import { workspaceService } from './WorkspaceService'
import { streamText, stepCountIs, UIMessage, convertToModelMessages, readUIMessageStream } from 'ai'
import { createAIProvider } from './AIProviderFactory'
import { toolRegister } from '../tools/registry'

import { nanoid } from 'nanoid'
export class ChatService {
  private wsClients = new Map<string, WebSocket>()
  registerWSClient(threadId: string, ws: WebSocket) {
    this.wsClients.set(threadId, ws)
    console.log(`WebSocket registered for thread: ${threadId}`)
  }

  unregisterWSClient(threadId: string) {
    this.wsClients.delete(threadId)
    console.log(`WebSocket unregistered for thread: ${threadId}`)
  }

  async sendMessage(threadId: string, message: string, model: string) {
    console.log(
      `ChatService.sendMessage called for threadId: ${threadId}, message: "${message}", model: "${model}"`
    )
    try {
      this.saveUserMessage(threadId, message)

      workspaceService.updateThread(threadId, { isGenerating: true })

      const messages = workspaceService.getMessagesByThreadId(threadId)
      console.log('[sendMessage] messages: ', messages)
      console.log('[sendMessage] model: ', model)

      const { aiModel, tools } = await this.prepareAIModel(model)

      const result = streamText({
        model: aiModel,
        messages: await convertToModelMessages(messages.map((msg) => msg.message)),
        tools,
        stopWhen: stepCountIs(10),
        onFinish: async ({ steps }) => {
          console.log('[ChatService] onFinish steps:', steps)

          const ws = this.wsClients.get(threadId)
          for (const step of steps) {
            if (step.toolCalls) {
              for (const toolCall of step.toolCalls) {
                if (toolCall.dynamic) {
                  continue
                }

                ws?.send(
                  JSON.stringify({
                    type: 'tool-call',
                    toolName: toolCall.toolName,
                    input: toolCall.input
                  })
                )
              }
            }
            if (step.toolResults) {
              for (const toolResult of step.toolResults) {
                if (toolResult.dynamic) {
                  continue
                }

                ws?.send(
                  JSON.stringify({
                    type: 'tool-result',
                    toolName: toolResult.toolName,
                    input: toolResult.input,
                    output: toolResult.output
                  })
                )
              }
            }
          }
        }
      })

      await this.handleMessageStream(
        threadId,
        readUIMessageStream({ stream: result.toUIMessageStream() })
      )

      workspaceService.updateThread(threadId, { isGenerating: false })
      this.wsClients.get(threadId)?.send(JSON.stringify({ type: 'done' }))

      return { success: true }
    } catch (error: any) {
      this.handleError(threadId, error)
      throw error
    }
  }

  private saveUserMessage(threadId: string, message: string): string {
    const userMessageId = nanoid()
    const userMessage: UIMessage = {
      id: userMessageId,
      role: 'user',
      parts: [
        {
          type: 'text',
          text: message,
          state: 'done'
        }
      ]
    }

    workspaceService.insertMessage({
      id: `${threadId}--${userMessageId}`,
      threadId,
      parentId: null,
      message: userMessage
    })

    return userMessageId
  }

  private async prepareAIModel(model: string) {
    const [providerId, modelName] = model.split('/')
    const provider = workspaceService.getProviderById(providerId)

    if (!provider) {
      throw new Error(`Provider not found: ${providerId}`)
    }

    const aiModel = createAIProvider(provider, modelName)
    const tools = toolRegister.getToolsForAI()
    console.log('[ChatService] tools:', Object.keys(tools))

    return { aiModel, tools }
  }

  private broadcastMessagePart(threadId: string, part: any) {
    const ws = this.wsClients.get(threadId)

    if (part.type === 'text') {
      ws?.send(JSON.stringify({ type: 'text', content: part.text }))
    } else if (part.type.startsWith('tool-')) {
      ws?.send(
        JSON.stringify({
          type: 'tool-call',
          toolCallId: part.toolCallId,
          toolName: part.toolName,
          state: part.state,
          input: part.input,
          output: part.output,
          errorText: part.errorText
        })
      )
    }
  }

  private async handleMessageStream(threadId: string, stream: AsyncIterable<UIMessage>) {
    const assistantMessageId = nanoid()
    const dbMessageId = `${threadId}--${assistantMessageId}`
    let isFirstMessage = true

    for await (const message of stream) {
      console.log('[ChatService] UIMessage:', message)
      const uiMessage: UIMessage = {
        id: assistantMessageId,
        role: 'assistant',
        parts: message.parts
      }

      if (isFirstMessage) {
        workspaceService.insertMessage({
          id: dbMessageId,
          threadId,
          parentId: null,
          message: uiMessage
        })
        isFirstMessage = false
      } else {
        workspaceService.updateMessage(dbMessageId, uiMessage)
      }

      for (const part of message.parts) {
        this.broadcastMessagePart(threadId, part)
      }
    }
  }

  private handleError(threadId: string, error: Error) {
    console.error(`failed to sendMessage`, error)
    workspaceService.updateThread(threadId, { isGenerating: false })

    const ws = this.wsClients.get(threadId)
    ws?.send(JSON.stringify({ type: 'error', message: error.message }))
  }
}

export const chatService = new ChatService()
