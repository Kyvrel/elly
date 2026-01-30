import type { UIMessagePart, UIDataTypes, UITools } from 'ai'

/**
 * WebSocket Message Types
 * 定义客户端和服务器之间的所有 WebSocket 消息类型
 */

// ============================================
// Client → Server Messages (客户端发送给服务器)
// ============================================

/**
 * 注册客户端到特定线程
 */
export interface WSClientRegisterMessage {
  type: 'register'
  threadId: string
}

/**
 * 停止生成
 */
export interface WSClientStopMessage {
  type: 'stop'
  threadId: string
}

export type WSClientMessage = WSClientRegisterMessage | WSClientStopMessage

// ============================================
// Server → Client Messages (服务器发送给客户端)
// ============================================

/**
 * 消息更新 - 包含完整的 parts 数组
 * 在流式生成过程中持续发送
 */
export interface WSServerMessageUpdate {
  type: 'message_update'
  messageId: string
  threadId: string
  parts: Array<UIMessagePart<UIDataTypes, UITools>>
  timestamp: string
}

/**
 * 生成完成
 */
export interface WSServerDoneMessage {
  type: 'done'
}

/**
 * 错误消息
 */
export interface WSServerErrorMessage {
  type: 'error'
  message: string
}

export type WSServerMessage = WSServerMessageUpdate | WSServerDoneMessage | WSServerErrorMessage

// ============================================
// Message Type Constants (消息类型常量)
// ============================================

export const WS_CLIENT_MESSAGE_TYPES = {
  REGISTER: 'register',
  STOP: 'stop'
} as const

export const WS_SERVER_MESSAGE_TYPES = {
  MESSAGE_UPDATE: 'message_update',
  DONE: 'done',
  ERROR: 'error'
} as const

// ============================================
// Type Guards (类型守卫)
// ============================================

export function isMessageUpdate(msg: WSServerMessage): msg is WSServerMessageUpdate {
  return msg.type === WS_SERVER_MESSAGE_TYPES.MESSAGE_UPDATE
}

export function isDoneMessage(msg: WSServerMessage): msg is WSServerDoneMessage {
  return msg.type === WS_SERVER_MESSAGE_TYPES.DONE
}

export function isErrorMessage(msg: WSServerMessage): msg is WSServerErrorMessage {
  return msg.type === WS_SERVER_MESSAGE_TYPES.ERROR
}

// ============================================
// Message Flow Documentation (消息流转文档)
// ============================================

/**
 * WebSocket 消息流转:
 *
 * 1. 连接建立
 *    Client → Server: { type: 'register', threadId: 'xxx' }
 *
 * 2. 发送消息 (通过 HTTP API)
 *    Client → HTTP POST /api/messages/send
 *
 * 3. 流式响应
 *    Server → Client: { type: 'message_update', messageId, threadId, parts, timestamp }
 *    (多次发送，每次包含完整的 parts 数组)
 *
 * 4. 生成完成
 *    Server → Client: { type: 'done' }
 *
 * 5. 错误处理
 *    Server → Client: { type: 'error', message: 'Error details' }
 *
 * 6. 停止生成 (可选)
 *    Client → Server: { type: 'stop', threadId: 'xxx' }
 */
