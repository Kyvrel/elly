import WebSocket from 'ws'
import { workspaceService } from './WorkspaceService'
import { streamText, tool, stepCountIs } from 'ai'
import { createAIProvider } from './AIProviderFactory'
import { toolRegister } from '../tools/registry'
import { permissionManager } from './PermissionManager'

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
      console.log('[sendMessage] messages: ', messages)
      console.log('[sendMessage] model: ', model)

      const [providerId, modelName] = model.split('/')
      const provider = workspaceService.getProviderById(providerId)
      if (!provider) {
        throw new Error(`Provider not found: ${providerId}`)
      }
      const aiModel = createAIProvider(provider, modelName)
      const tools = toolRegister.getAITools()

      const { textStream, toolCalls } = streamText({
        model: aiModel,
        messages: messages.map((msg) => ({ role: msg.message.role, content: msg.message.content })),
        tools: tools as any,
        stopWhen: stepCountIs(10)
      })
      let fullText = ''
      const ws = this.wsClients.get(threadId)

      for await (const chunk of textStream) {
        fullText += chunk
        ws?.send(JSON.stringify({ type: 'text', content: chunk }))
      }

      // Wait for all tool calls to complete
      const allToolCalls = await toolCalls

      for (const toolCall of allToolCalls) {
        const tool = toolRegister.getTool(toolCall.toolName)
        if (!tool) {
          console.error(`there's no tool: `, toolCall)
          continue
        }

        const approved = await permissionManager.requestPermission(tool, toolCall.args)
        if (!approved) {
          console.info(`tool call denied, tool: ${tool.name}`)
          continue
        }

        // notify ui
        ws?.send(
          JSON.stringify({
            type: 'tool-start',
            toolName: toolCall.toolName,
            params: toolCall.args
          })
        )

        try {
          const result = await tool.execute(toolCall.args)
          ws?.send(
            JSON.stringify({
              type: 'tool-result',
              toolName: toolCall.toolName,
              result
            })
          )
        } catch (error: any) {
          ws?.send(JSON.stringify({ type: 'tool-error', error: error.message }))
        }
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
