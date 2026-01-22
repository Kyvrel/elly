import { WebSocketServer } from 'ws'
import { chatService } from './ChatService'

export function createWebSocketServer(port = 8765) {
  const wss = new WebSocketServer({ port })

  wss.on('connection', (ws) => {
    ws.on('message', function message(data) {
      console.log('received: %s', data)

      try {
        const message = JSON.parse(data.toString())
        if (message.type == 'register') {
          chatService.registerWSClient(message.threadId, ws)
        }
      } catch (error) {
        console.error(`Websocket message error:`, error)
      }
    })
    ws.on('close', () => {
      console.log(`Websocket client disconnected`)
    })

    ws.on('error', (error) => {
      console.error(`Websocket error:`, error)
    })
  })

  return wss
}
