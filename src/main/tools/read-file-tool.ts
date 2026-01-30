import { readFile } from 'node:fs/promises'
import { workspaceManager } from '../services/WorkspaceManager'
import { ToolCategory, ToolDefinition } from '../../shared/types-tools'
import { z } from 'zod'

export const ReadFileTool: ToolDefinition = {
  name: 'read_file',
  description: 'read file content',
  category: ToolCategory.READ,
  needPermission: false,
  parameters: z.object({
    file_path: z.string()
  }),
  execute: async ({ file_path }) => {
    try {
      const absolutePath = workspaceManager.resolvePath(file_path)
      const content = await readFile(absolutePath, 'utf8')
      console.log('ReadFileTool called, content: ', content)
      return { success: true, data: content }
    } catch (error: any) {
      throw new Error(`Failed to read file ${file_path}: ${error.message}`)
    }
  }
}
