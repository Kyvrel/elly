import { Server } from 'http'
import express from 'express'
import cors from 'cors'
import { chatService } from '../services/ChatService.js'
import { workspaceManager } from '../services/WorkspaceManager.js'
import { dbService } from '../services/DBService.js'

const API_PORT = 23001

export function createApiServer(): Server {
  const app = express()

  app.use(cors())
  app.use(express.json({ limit: '50mb' }))

  app.use((req, _, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`)
    next()
  })
  app.get('/api/health', (_, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  // ===== Providers =====

  app.get('/api/providers', (_, res) => {
    const providers = dbService.provider.getProviders()
    res.json(providers)
  })

  app.post('/api/providers', (req, res) => {
    dbService.provider.upsertProviders(req.body)
    res.status(201).json({ success: true })
  })

  app.delete('/api/providers/:id', (req, res) => {
    dbService.provider.deleteProvider(req.params.id)
    res.status(204).send()
  })

  // ===== Threads =====

  app.get('/api/threads', (_, res) => {
    res.json(dbService.thread.getAllThreads())
  })

  app.get('/api/threads/:id', (req, res) => {
    const thread = dbService.thread.getThreadsById(req.params.id)
    if (!thread) {
      return res.status(404).json({ error: 'thread not found' })
    }
    return res.json(thread)
  })

  app.post('/api/threads', (req, res) => {
    const { title, model } = req.body
    const thread = dbService.thread.createThreads(title, model)
    res.status(201).json(thread)
  })

  app.put('/api/threads/:id', (req, res) => {
    dbService.thread.updateThread(req.params.id, req.body)
    res.json({ success: true })
  })

  app.delete('/api/threads/:id', (req, res) => {
    dbService.thread.deleteThread(req.params.id)
    res.status(204).send()
  })

  // ===== Messages =====
  app.get('/api/threads/:threadId/messages', (req, res) => {
    res.json(dbService.message.getMessagesByThreadId(req.params.threadId))
  })

  // ===== Settings =====

  app.get('/api/settings', (_, res) => {
    const settings = dbService.settings.getSettings()
    res.json(settings)
  })

  app.put('/api/settings', (req, res) => {
    dbService.settings.updateSettings(req.body)
    res.json({ success: true })
  })

  // ===== Workspaces =====

  app.get('/api/workspaces', (_, res) => {
    const workspaces = dbService.workspace.getAllWorkspaces()
    res.json(workspaces)
  })

  app.post('/api/workspaces', async (req, res) => {
    try {
      const { name, path } = req.body
      const workspace = await workspaceManager.createWorkspace(name, path)
      res.status(201).json(workspace)
    } catch (error: any) {
      res.status(400).json({ error: error.message })
    }
  })

  app.put('/api/workspaces/:id/activate', (req, res) => {
    try {
      dbService.workspace.setActiveWorkspace(req.params.id)
      res.json({ success: true })
    } catch (error: any) {
      res.status(400).json({ error: error.message })
    }
  })

  app.get('/api/workspaces/active', (_, res) => {
    const workspace = dbService.workspace.getActiveWorkspace()
    if (!workspace) {
      return res.status(404).json({ error: 'No active workspace' })
    }
    res.json(workspace)
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
