import { readFile } from 'node:fs/promises'
import { workspaceManager } from '../services/WorkspaceManager'
import { dbService } from '../services/DBService'
import { ToolCategory, ToolDefinition } from '../../shared/types-tools'
import { z } from 'zod'

// TODO :
// limit, offset
const ReadFileSchema = z.object({
  file_path: z.string().describe('Path to the file to be read.')
})

export const ReadFileTool: ToolDefinition = {
  name: 'read_file',
  description: 'Reads and returns the complete content of a specified file.',
  category: ToolCategory.READ,
  needsApproval: false,
  parameters: ReadFileSchema,
  execute: async (params) => {
    try {
      const { file_path } = ReadFileSchema.parse(params)
      const workspace = dbService.workspace.getActiveWorkspace()
      if (!workspace) {
        return { success: false, error: 'No active workspace' }
      }
      const absolutePath = workspaceManager.resolvePath(file_path)
      if (!workspaceManager.isPathInWorkspace(absolutePath, workspace.id)) {
        return { success: false, error: 'File outside workspace' }
      }
      if (workspaceManager.isSensitiveFile(absolutePath)) {
        return { success: false, error: 'Sensitive file blocked' }
      }
      const content = await readFile(absolutePath, 'utf8')
      console.log('ReadFileTool called, content: ', content)
      return { success: true, data: content }
    } catch (error: any) {
      throw new Error(`Failed to read file ${params}: ${error.message}`)
    }
  }
}
