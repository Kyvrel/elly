import WebSocket from 'ws'
import { workspaceService } from './workspaceService'
import { streamText } from 'ai'
import { createAIProvider } from './AIProviderFactory'

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
      workspaceService.insertMessage({
        threadId,
        parentId: null,
        message: { role: 'user', content: message }
      })

      workspaceService.updateThread(threadId, {
        isGenerating: true
      })

      const messages = workspaceService.getMessagesByThreadId(threadId)

      const [providerId, modelName] = model.split('/')
      const provider = workspaceService.getProviderById(providerId)
      if (!provider) {
        throw new Error(`Provider not found: ${providerId}`)
      }
      const aiModel = createAIProvider(provider, modelName)
      const { textStream } = streamText({ model: aiModel, messages: messages as any })
      let fullText = ''
      const ws = this.wsClients.get(threadId)

      for await (const chunk of textStream) {
        fullText += chunk
        ws?.send(JSON.stringify({ type: 'text', content: chunk }))
      }

      workspaceService.insertMessage({
        threadId,
        parentId: null,
        message: { role: 'assistant', content: fullText }
      })

      workspaceService.updateThread(threadId, { isGenerating: false })
      ws?.send(JSON.stringify({ type: 'done' }))

      return { success: true }
    } catch (error: any) {
      console.error(`failed to sendMessage`, error)
      workspaceService.updateThread(threadId, { isGenerating: false })
      const ws = this.wsClients.get(threadId)
      ws?.send(JSON.stringify({ type: 'error', message: error.message }))
      throw error
    }
  }
}

export const chatService = new ChatService()
