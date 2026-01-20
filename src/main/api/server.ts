import express from 'express';
import cors from 'cors';
import { workspaceService } from '../services/workspaceService.js';

const API_PORT = 29999

export function createApiServer() {
  const app = express()

  app.use(cors())
  app.use(express.json({limit: '50mb'}))

  app.use((req, res, next)=> {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`)
    next()
  })

  app.get('/api/health', (req, res)=> {
    res.json({status: 'ok', timestamp: new Date().toISOString()})
  })

  app.get('/api/settings', (req, res)=> {
    const settings = workspaceService.getSettings()
    res.json(settings)
  })

  const server = app.listen(API_PORT, ()=> {
    console.log(`HTTP API server running on port ${API_PORT}`)
  })
  return server
}

// Run server if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createApiServer()
}
