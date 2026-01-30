import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ChatService } from '../ChatService'
import { workspaceService } from '../WorkspaceService'
import type { WebSocket } from 'ws'

// Mock dependencies
vi.mock('../workspaceService')
vi.mock('../AIProviderFactory')
vi.mock('ai', () => ({
  streamText: vi.fn()
}))

describe('ChatService', () => {
  let chatService: ChatService
  let mockWebSocket: WebSocket

  beforeEach(() => {
    chatService = new ChatService()
    mockWebSocket = {
      send: vi.fn(),
      close: vi.fn()
    } as any
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('WebSocket Client Management', () => {
    it('should register and unregister WebSocket client', () => {
      const threadId = 'thread-123'

      chatService.registerWSClient(threadId, mockWebSocket)
      expect(chatService['wsClients'].has(threadId)).toBe(true)

      chatService.unregisterWSClient(threadId)
      expect(chatService['wsClients'].has(threadId)).toBe(false)
    })
  })

  describe('sendMessage - Core Flow', () => {
    const threadId = 'thread-123'
    const userMessage = 'Hello AI!'
    const model = 'openai/gpt-4o-mini'

    beforeEach(() => {
      // Mock workspaceService
      vi.mocked(workspaceService.insertMessage).mockReturnValue({
        id: 'msg-1',
        threadId,
        parentId: null,
        message: { role: 'user', content: userMessage },
        createdAt: new Date(),
        updatedAt: new Date()
      })

      vi.mocked(workspaceService.getMessagesByThreadId).mockReturnValue([
        {
          id: 'msg-1',
          threadId,
          parentId: null,
          message: { role: 'user', content: userMessage },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ])

      vi.mocked(workspaceService.getProviderById).mockReturnValue({
        id: 'openai',
        name: 'OpenAI',
        type: 'openai',
        apiKey: 'test-api-key',
        baseUrl: '',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      vi.mocked(workspaceService.updateThread).mockImplementation(() => {})
    })

    it('should save user message and update thread state', async () => {
      const { streamText } = await import('ai')

      vi.mocked(streamText).mockReturnValue({
        textStream: (async function* () {
          yield 'Response'
        })(),
        text: Promise.resolve('Response')
      } as any)

      await chatService.sendMessage(threadId, userMessage, model)

      // Should save user message
      expect(workspaceService.insertMessage).toHaveBeenCalledWith({
        threadId,
        parentId: null,
        message: { role: 'user', content: userMessage }
      })

      // Should update thread generating state
      expect(workspaceService.updateThread).toHaveBeenCalledWith(threadId, { isGenerating: true })
      expect(workspaceService.updateThread).toHaveBeenCalledWith(threadId, { isGenerating: false })
    })

    it('should parse model and get provider', async () => {
      const { streamText } = await import('ai')

      vi.mocked(streamText).mockReturnValue({
        textStream: (async function* () {
          yield 'test'
        })(),
        text: Promise.resolve('test')
      } as any)

      await chatService.sendMessage(threadId, userMessage, model)

      expect(workspaceService.getProviderById).toHaveBeenCalledWith('openai')
      expect(workspaceService.getMessagesByThreadId).toHaveBeenCalledWith(threadId)
    })

    it('should throw error if provider not found', async () => {
      vi.mocked(workspaceService.getProviderById).mockReturnValue(undefined)

      await expect(chatService.sendMessage(threadId, userMessage, model)).rejects.toThrow(
        'Provider not found: openai'
      )
    })

    it('should stream text chunks to WebSocket and save assistant message', async () => {
      const { streamText } = await import('ai')

      chatService.registerWSClient(threadId, mockWebSocket)

      vi.mocked(streamText).mockReturnValue({
        textStream: (async function* () {
          yield 'Hello'
          yield ' there!'
        })(),
        text: Promise.resolve('Hello there!')
      } as any)

      await chatService.sendMessage(threadId, userMessage, model)

      // Should send text chunks
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'text', content: 'Hello' })
      )
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'text', content: ' there!' })
      )

      // Should send done event
      expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify({ type: 'done' }))

      // Should save assistant message with full text
      expect(workspaceService.insertMessage).toHaveBeenCalledTimes(2)
      const assistantMessageCall = vi.mocked(workspaceService.insertMessage).mock.calls[1][0]
      expect(assistantMessageCall.message.role).toBe('assistant')
      expect(assistantMessageCall.message.content).toBe('Hello there!')
    })

    it('should handle errors gracefully', async () => {
      const { streamText } = await import('ai')
      const errorMessage = 'AI API Error'

      chatService.registerWSClient(threadId, mockWebSocket)

      // Mock streamText to throw error
      vi.mocked(streamText).mockImplementation(() => {
        throw new Error(errorMessage)
      })

      await expect(chatService.sendMessage(threadId, userMessage, model)).rejects.toThrow(
        errorMessage
      )

      // Should reset generating state on error
      expect(workspaceService.updateThread).toHaveBeenCalledWith(threadId, { isGenerating: false })

      // Should send error event to WebSocket
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'error', message: errorMessage })
      )
    })

    it('should work without WebSocket client', async () => {
      const { streamText } = await import('ai')

      vi.mocked(streamText).mockReturnValue({
        textStream: (async function* () {
          yield 'test'
        })(),
        text: Promise.resolve('test')
      } as any)

      await expect(chatService.sendMessage(threadId, userMessage, model)).resolves.toEqual({
        success: true
      })
    })
  })

  describe('Integration', () => {
    it('should handle complete chat flow', async () => {
      const { streamText } = await import('ai')
      const threadId = 'thread-test'

      chatService.registerWSClient(threadId, mockWebSocket)

      vi.mocked(streamText).mockReturnValue({
        textStream: (async function* () {
          yield 'AI Response'
        })(),
        text: Promise.resolve('AI Response')
      } as any)

      await chatService.sendMessage(threadId, 'Test message', 'openai/gpt-4o-mini')

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'text', content: 'AI Response' })
      )
      expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify({ type: 'done' }))

      chatService.unregisterWSClient(threadId)
      expect(chatService['wsClients'].has(threadId)).toBe(false)
    })
  })
})
