import { z } from 'zod'

export enum ToolCategory {
  READ = 'read',
  WRITE = 'write',
  EDIT = 'edit',
  EXECUTE = 'execute',
  SEARCH = 'search',
  NETWORK = 'network'
}

export interface ToolResult {
  data?: any
  success: boolean
  error?: string
  metadata?: Record<string, any>
}

export interface ToolDefinition {
  name: string
  description: string
  category: ToolCategory
  needPermission: boolean
  parameters: z.ZodSchema
  execute: (params: any) => Promise<ToolResult>
}

export interface AITool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: Record<string, any>
      required: string[]
    }
  }
}
