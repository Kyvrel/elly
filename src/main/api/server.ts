import express from 'express'
import cors from 'cors'
import { workspaceService } from '../services/workspaceService.js'
import { chatService } from '../services/ChatService.js'

const API_PORT = 23001

export function createApiServer() {
  const app = express()

  app.use(cors())
  app.use(express.json({ limit: '50mb' }))

  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`)
    next()
  })

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  // ===== Providers =====

  app.get('/api/providers', (req, res) => {
    const providers = workspaceService.getProviders()
    res.json(providers)
  })

  app.post('/api/providers', (req, res) => {
    workspaceService.upsertProviders(req.body)
    res.status(201).json({ success: true })
  })

  app.delete('/api/providers/:id', (req, res) => {
    workspaceService.deleteProvider(req.params.id)
    res.status(204).send()
  })

  // ===== Threads =====

  app.get('/api/threads', (req, res) => {
    res.json(workspaceService.getAllThreads())
  })

  app.get('/api/threads/:id', (req, res) => {
    const thread = workspaceService.getThreadsById(req.params.id)
    if (!thread) {
      return res.status(404).json({ error: 'thread not found' })
    }
    return res.json(thread)
  })

  app.post('/api/threads', (req, res) => {
    const { title, model } = req.body
    const thread = workspaceService.createThreads(title, model)
    res.status(201).json(thread)
  })

  app.put('/api/threads/:id', (req, res) => {
    workspaceService.updateThread(req.params.id, req.body)
    res.json({ success: true })
  })

  app.delete('/api/threads/:id', (req, res) => {
    workspaceService.deleteThread(req.params.id)
    res.status(204).send()
  })

  // ===== Messages =====
  app.get('/api/threads/:threadId/messages', (req, res) => {
    res.json(workspaceService.getMessagesByThreadId(req.params.threadId))
  })

  // ===== Settings =====

  app.get('/api/settings', (req, res) => {
    const settings = workspaceService.getSettings()
    res.json(settings)
  })

  app.put('/api/settings', (req, res) => {
    workspaceService.updateSettings(req.body)
    res.json({ success: true })
  })

  // ===== Chat Completions（触发流式响应） =====
  app.post('/api/chat/completions', async (req, res) => {
    const { threadId, message, model } = req.body
    try {
      await chatService.sendMessage(threadId, message, model)
      res.json({ success: true })
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })

  const server = app.listen(API_PORT, () => {
    console.log(`HTTP API server running on port ${API_PORT}`)
  })
  return server
}

// Run server if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createApiServer()
}
