import WebSocket from 'ws'
import { workspaceService } from './WorkspaceService'
import {
  streamText,
  stepCountIs,
  UIMessage,
  convertToModelMessages,
  readUIMessageStream,
  type UIMessagePart,
  type UIDataTypes,
  type UITools
} from 'ai'
import { createAIProvider } from './AIProviderFactory'
import { toolRegister } from '../tools/registry'
import {
  WS_SERVER_MESSAGE_TYPES,
  type WSServerMessageUpdate,
  type WSServerDoneMessage,
  type WSServerErrorMessage
} from '../../shared/types-websocket'

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
        onError({ error }) {
          console.error('An error occurred streamText:', error) // Your error logging logic here
        }
      })

      await this.handleMessageStream(
        threadId,
        readUIMessageStream({ stream: result.toUIMessageStream() })
      )

      workspaceService.updateThread(threadId, { isGenerating: false })

      const doneMessage: WSServerDoneMessage = {
        type: WS_SERVER_MESSAGE_TYPES.DONE
      }
      this.wsClients.get(threadId)?.send(JSON.stringify(doneMessage))

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

  private broadcastMessageUpdate(
    threadId: string,
    messageId: string,
    parts: Array<UIMessagePart<UIDataTypes, UITools>>
  ) {
    const ws = this.wsClients.get(threadId)

    const message: WSServerMessageUpdate = {
      type: WS_SERVER_MESSAGE_TYPES.MESSAGE_UPDATE,
      messageId,
      threadId,
      parts,
      timestamp: new Date().toISOString()
    }

    ws?.send(JSON.stringify(message))
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

      // Send complete parts array via WebSocket
      this.broadcastMessageUpdate(threadId, assistantMessageId, message.parts)
    }
  }

  private handleError(threadId: string, error: Error) {
    console.error(`failed to sendMessage`, error)
    workspaceService.updateThread(threadId, { isGenerating: false })

    const ws = this.wsClients.get(threadId)
    const errorMessage: WSServerErrorMessage = {
      type: WS_SERVER_MESSAGE_TYPES.ERROR,
      message: error.message
    }
    ws?.send(JSON.stringify(errorMessage))
  }
}

export const chatService = new ChatService()
