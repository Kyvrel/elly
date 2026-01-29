export type { ChatMessage, ChatThread, Provider } from '../main/db/schema'

export interface CreateThreadRequest {
  title: string
  model: string
}

export interface ChatCompletionRequest {
  threadID: string
  message: string
  model: string // 格式: "providerId/modelName"
}

export interface ApiResponse<T = void> {
  success: boolean
  data?: T
  error?: string
}
