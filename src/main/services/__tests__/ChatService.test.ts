import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ChatService } from '../ChatService'
import { workspaceService } from '../workspaceService'
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
      close: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      once: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    } as any
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('registerWSClient', () => {
    it('should register a WebSocket client for a thread', () => {
      const threadId = 'thread-123'

      chatService.registerWSClient(threadId, mockWebSocket)

      // Verify WebSocket was registered (we can test this by sending a message later)
      expect(chatService['wsClients'].has(threadId)).toBe(true)
      expect(chatService['wsClients'].get(threadId)).toBe(mockWebSocket)
    })

    it('should log a success message when registering a client', () => {
      const consoleSpy = vi.spyOn(console, 'log')
      const threadId = 'thread-123'

      chatService.registerWSClient(threadId, mockWebSocket)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(`WebSocket registered for thread: ${threadId}`)
      )
    })

    it('should replace an existing WebSocket client for the same thread', () => {
      const threadId = 'thread-123'
      const mockWebSocket2 = { ...mockWebSocket } as any

      chatService.registerWSClient(threadId, mockWebSocket)
      chatService.registerWSClient(threadId, mockWebSocket2)

      expect(chatService['wsClients'].get(threadId)).toBe(mockWebSocket2)
    })
  })

  describe('unregisterWSClient', () => {
    it('should unregister a WebSocket client for a thread', () => {
      const threadId = 'thread-123'

      chatService.registerWSClient(threadId, mockWebSocket)
      chatService.unregisterWSClient(threadId)

      expect(chatService['wsClients'].has(threadId)).toBe(false)
    })

    it('should log a message when unregistering a client', () => {
      const consoleSpy = vi.spyOn(console, 'log')
      const threadId = 'thread-123'

      chatService.registerWSClient(threadId, mockWebSocket)
      chatService.unregisterWSClient(threadId)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(`WebSocket unregistered for thread: ${threadId}`)
      )
    })

    it('should not throw error when unregistering non-existent thread', () => {
      expect(() => {
        chatService.unregisterWSClient('non-existent-thread')
      }).not.toThrow()
    })
  })

  describe('sendMessage', () => {
    const threadId = 'thread-123'
    const userMessage = 'Hello AI!'
    const model = 'openai/gpt-4o-mini'

    beforeEach(() => {
      // Mock workspaceService methods
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

      vi.mocked(workspaceService.updateThread).mockReturnValue(undefined)
    })

    it('should save user message to database', async () => {
      const { streamText } = await import('ai')

      // Mock streamText to return a simple stream
      vi.mocked(streamText).mockResolvedValue({
        textStream: (async function* () {
          yield 'Hello'
          yield ' there!'
        })(),
        text: Promise.resolve('Hello there!')
      } as any)

      await chatService.sendMessage(threadId, userMessage, model)

      expect(workspaceService.insertMessage).toHaveBeenCalledWith({
        threadId,
        parentId: null,
        message: { role: 'user', content: userMessage },
        timestamp: expect.any(String)
      })
    })

    it('should update thread isGenerating to true at start', async () => {
      const { streamText } = await import('ai')

      vi.mocked(streamText).mockResolvedValue({
        textStream: (async function* () {
          yield 'test'
        })(),
        text: Promise.resolve('test')
      } as any)

      await chatService.sendMessage(threadId, userMessage, model)

      expect(workspaceService.updateThread).toHaveBeenCalledWith(threadId, { isGenerating: true })
    })

    it('should retrieve chat history from database', async () => {
      const { streamText } = await import('ai')

      vi.mocked(streamText).mockResolvedValue({
        textStream: (async function* () {
          yield 'test'
        })(),
        text: Promise.resolve('test')
      } as any)

      await chatService.sendMessage(threadId, userMessage, model)

      expect(workspaceService.getMessagesByThreadId).toHaveBeenCalledWith(threadId)
    })

    it('should parse model string and retrieve provider', async () => {
      const { streamText } = await import('ai')

      vi.mocked(streamText).mockResolvedValue({
        textStream: (async function* () {
          yield 'test'
        })(),
        text: Promise.resolve('test')
      } as any)

      await chatService.sendMessage(threadId, userMessage, model)

      expect(workspaceService.getProviderById).toHaveBeenCalledWith('openai')
    })

    it('should throw error if provider not found', async () => {
      vi.mocked(workspaceService.getProviderById).mockReturnValue(undefined)

      await expect(chatService.sendMessage(threadId, userMessage, model)).rejects.toThrow(
        'Provider not found: openai'
      )
    })

    it('should stream text chunks to WebSocket client', async () => {
      const { streamText } = await import('ai')

      // Register WebSocket
      chatService.registerWSClient(threadId, mockWebSocket)

      // Mock streamText to return chunks
      vi.mocked(streamText).mockResolvedValue({
        textStream: (async function* () {
          yield 'Hello'
          yield ' there'
          yield '!'
        })(),
        text: Promise.resolve('Hello there!')
      } as any)

      await chatService.sendMessage(threadId, userMessage, model)

      // Verify WebSocket.send was called for each chunk
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'text', content: 'Hello' })
      )
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'text', content: ' there' })
      )
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'text', content: '!' })
      )
    })

    it('should save assistant message with complete text after streaming', async () => {
      const { streamText } = await import('ai')

      chatService.registerWSClient(threadId, mockWebSocket)

      vi.mocked(streamText).mockResolvedValue({
        textStream: (async function* () {
          yield 'Hello'
          yield ' there!'
        })(),
        text: Promise.resolve('Hello there!')
      } as any)

      await chatService.sendMessage(threadId, userMessage, model)

      // Should be called twice: once for user message, once for assistant message
      expect(workspaceService.insertMessage).toHaveBeenCalledTimes(2)

      // Check the assistant message
      const assistantMessageCall = vi.mocked(workspaceService.insertMessage).mock.calls[1][0]
      expect(assistantMessageCall.message.role).toBe('assistant')
      expect(assistantMessageCall.message.content).toBe('Hello there!')
    })

    it('should send done event to WebSocket when complete', async () => {
      const { streamText } = await import('ai')

      chatService.registerWSClient(threadId, mockWebSocket)

      vi.mocked(streamText).mockResolvedValue({
        textStream: (async function* () {
          yield 'test'
        })(),
        text: Promise.resolve('test')
      } as any)

      await chatService.sendMessage(threadId, userMessage, model)

      expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify({ type: 'done' }))
    })

    it('should update thread isGenerating to false when complete', async () => {
      const { streamText } = await import('ai')

      vi.mocked(streamText).mockResolvedValue({
        textStream: (async function* () {
          yield 'test'
        })(),
        text: Promise.resolve('test')
      } as any)

      await chatService.sendMessage(threadId, userMessage, model)

      // Should be called twice: true at start, false at end
      expect(workspaceService.updateThread).toHaveBeenCalledWith(threadId, { isGenerating: false })
    })

    it('should handle errors and update thread state', async () => {
      const { streamText } = await import('ai')
      const errorMessage = 'AI API Error'

      chatService.registerWSClient(threadId, mockWebSocket)

      vi.mocked(streamText).mockRejectedValue(new Error(errorMessage))

      await expect(chatService.sendMessage(threadId, userMessage, model)).rejects.toThrow(
        errorMessage
      )

      // Should set isGenerating to false on error
      expect(workspaceService.updateThread).toHaveBeenCalledWith(threadId, { isGenerating: false })
    })

    it('should send error event to WebSocket on failure', async () => {
      const { streamText } = await import('ai')
      const errorMessage = 'AI API Error'

      chatService.registerWSClient(threadId, mockWebSocket)

      vi.mocked(streamText).mockRejectedValue(new Error(errorMessage))

      await expect(chatService.sendMessage(threadId, userMessage, model)).rejects.toThrow()

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'error', message: errorMessage })
      )
    })

    it('should log error when chat fails', async () => {
      const { streamText } = await import('ai')
      const consoleErrorSpy = vi.spyOn(console, 'error')
      const errorMessage = 'AI API Error'

      vi.mocked(streamText).mockRejectedValue(new Error(errorMessage))

      await expect(chatService.sendMessage(threadId, userMessage, model)).rejects.toThrow()

      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Chat error:', expect.any(Error))
    })

    it('should work without WebSocket client registered', async () => {
      const { streamText } = await import('ai')

      // Don't register WebSocket
      vi.mocked(streamText).mockResolvedValue({
        textStream: (async function* () {
          yield 'test'
        })(),
        text: Promise.resolve('test')
      } as any)

      // Should not throw
      await expect(chatService.sendMessage(threadId, userMessage, model)).resolves.toEqual({
        success: true
      })
    })

    it('should return success object on completion', async () => {
      const { streamText } = await import('ai')

      vi.mocked(streamText).mockResolvedValue({
        textStream: (async function* () {
          yield 'test'
        })(),
        text: Promise.resolve('test')
      } as any)

      const result = await chatService.sendMessage(threadId, userMessage, model)

      expect(result).toEqual({ success: true })
    })

    it('should handle multiple model formats correctly', async () => {
      const { streamText } = await import('ai')
      const { createAIProvider } = await import('../AIProviderFactory')

      vi.mocked(streamText).mockResolvedValue({
        textStream: (async function* () {
          yield 'test'
        })(),
        text: Promise.resolve('test')
      } as any)

      vi.mocked(createAIProvider).mockReturnValue({} as any)

      // Test with different model formats
      await chatService.sendMessage(threadId, userMessage, 'anthropic/claude-3-5-sonnet-20241022')

      expect(workspaceService.getProviderById).toHaveBeenCalledWith('anthropic')
    })

    it('should accumulate complete text from all chunks', async () => {
      const { streamText } = await import('ai')

      vi.mocked(streamText).mockResolvedValue({
        textStream: (async function* () {
          yield 'The '
          yield 'quick '
          yield 'brown '
          yield 'fox'
        })(),
        text: Promise.resolve('The quick brown fox')
      } as any)

      await chatService.sendMessage(threadId, userMessage, model)

      const assistantMessageCall = vi.mocked(workspaceService.insertMessage).mock.calls[1][0]
      expect(assistantMessageCall.message.content).toBe('The quick brown fox')
    })
  })

  describe('Integration tests', () => {
    it('should handle complete chat flow: register, send, unregister', async () => {
      const { streamText } = await import('ai')
      const threadId = 'thread-integration'

      // 1. Register WebSocket
      chatService.registerWSClient(threadId, mockWebSocket)

      // 2. Send message
      vi.mocked(streamText).mockResolvedValue({
        textStream: (async function* () {
          yield 'Response'
        })(),
        text: Promise.resolve('Response')
      } as any)

      await chatService.sendMessage(threadId, 'Test', 'openai/gpt-4o-mini')

      // 3. Verify WebSocket received messages
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'text', content: 'Response' })
      )
      expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify({ type: 'done' }))

      // 4. Unregister
      chatService.unregisterWSClient(threadId)
      expect(chatService['wsClients'].has(threadId)).toBe(false)
    })

    it('should handle multiple concurrent threads', async () => {
      const { streamText } = await import('ai')
      const thread1 = 'thread-1'
      const thread2 = 'thread-2'
      const mockWs1 = { ...mockWebSocket } as any
      const mockWs2 = { ...mockWebSocket, send: vi.fn() } as any

      chatService.registerWSClient(thread1, mockWs1)
      chatService.registerWSClient(thread2, mockWs2)

      expect(chatService['wsClients'].size).toBe(2)

      vi.mocked(streamText).mockResolvedValue({
        textStream: (async function* () {
          yield 'test'
        })(),
        text: Promise.resolve('test')
      } as any)

      // Send to thread 1
      await chatService.sendMessage(thread1, 'msg1', 'openai/gpt-4o-mini')

      // Only mockWs1 should receive the message
      expect(mockWs1.send).toHaveBeenCalled()
      expect(mockWs2.send).not.toHaveBeenCalled()
    })
  })
})
