import { writeFile, mkdir } from 'node:fs/promises'
import { workspaceManager } from '../services/WorkspaceManager'
import { dbService } from '../services/DBService'
import { ToolCategory, ToolDefinition } from '../../shared/types-tools'
import { z } from 'zod'
import { dirname } from 'node:path'

const WriteFileSchema = z.object({
  file_path: z.string().describe('Path where the file should be written.'),
  content: z.string().describe('The content to write to the file.')
})
export const WriteFileTool: ToolDefinition = {
  name: 'write_file',
  description:
    'Writes content to a file. Overwrites the file if it already exists, and creates parent directories if necessary.',
  category: ToolCategory.WRITE,
  needsApproval: true, // Must be TRUE for write
  parameters: WriteFileSchema,
  execute: async (params) => {
    try {
      const { file_path, content } = WriteFileSchema.parse(params)
      const workspace = dbService.workspace.getActiveWorkspace()
      if (!workspace) {
        return { success: false, error: 'No active workspace' }
      }
      const absolutePath = workspaceManager.resolvePath(file_path)
      if (workspaceManager.isPathInWorkspace(absolutePath, workspace.id)) {
        return { success: false, error: 'File outside workspace' }
      }
      if (workspaceManager.isSensitiveFile(absolutePath)) {
        return { success: false, error: 'Cannot write to sensitive file' }
      }

      await mkdir(dirname(absolutePath), { recursive: true })
      await writeFile(absolutePath, content, 'utf-8')
      return {
        success: true,
        data: { written: true, path: file_path },
        metadata: { bytes: Buffer.byteLength(content) }
      }
    } catch (error: any) {
      throw new Error(`Failed to write file ${params}: ${error.message}`)
    }
  }
}
