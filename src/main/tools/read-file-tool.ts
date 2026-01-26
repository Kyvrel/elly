import { readFile } from 'node:fs/promises'
import { workspaceManager } from '../services/WorkspaceManager'
import { ToolCategory, ToolDefinition } from '../../shared/types-tools'
import { z } from 'zod'

export const ReadFileTool: ToolDefinition = {
  name: 'read_file',
  description: 'read file content',
  category: ToolCategory.READ,
  requiresApproval: false,
  parameters: z.object({
    file_path: z.string()
  }),
  execute: async ({ file_path }) => {
    const absolutePath = workspaceManager.resolvePath(file_path)
    const content = await readFile(absolutePath, 'utf8')
    return { success: true, data: content }
  }
}
