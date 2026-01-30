import WebSocket from 'ws'
import { workspaceService } from './WorkspaceService'
import { streamText, stepCountIs } from 'ai'
import { createAIProvider } from './AIProviderFactory'
import { toolRegister } from '../tools/registry'

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
      const tools = toolRegister.getToolsForAI()
      console.log('[ChatService] tools:', Object.keys(tools))

      const result = streamText({
        model: aiModel,
        messages: messages.map((msg) => ({ role: msg.message.role, content: msg.message.content })),
        tools,
        stopWhen: stepCountIs(10),
        onFinish: async ({ steps }) => {
          // Log all tool calls and results from all steps
          console.log('[ChatService] onFinish steps:', steps)

          const ws = this.wsClients.get(threadId)
          for (const step of steps) {
            if (step.toolCalls) {
              for (const toolCall of step.toolCalls) {
                // Skip dynamic tools
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
                // Skip dynamic tools (tools without execute function)
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

      let fullText = ''
      const ws = this.wsClients.get(threadId)

      for await (const chunk of result.textStream) {
        fullText += chunk
        console.log('[ChatService] textStream:', fullText)
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
