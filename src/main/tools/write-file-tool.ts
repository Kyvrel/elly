import { writeFile, mkdir } from 'node:fs/promises'
import { workspaceManager } from '../services/WorkspaceManager'
import { ToolCategory, ToolDefinition } from '../../shared/types-tools'
import { z } from 'zod'
import { dirname } from 'node:path'

export const WriteFileTool: ToolDefinition = {
  name: 'write_file',
  description: 'Writes content to a file. Overwrites the file if it already exists, and creates parent directories if necessary.',
  category: ToolCategory.WRITE,
  needsApproval: true, // Must be TRUE for write
  parameters: z.object({
    file_path: z.string().describe('Path where the file should be written.'),
    content: z.string().describe('The content to write to the file.')
  }),
  execute: async ({ file_path, content }) => {
    try {
      const absolutePath = workspaceManager.resolvePath(file_path)
      await mkdir(dirname(absolutePath), { recursive: true })
      await writeFile(absolutePath, content, 'utf-8')
      return {
        success: true,
        data: { written: true, path: file_path },
        metadata: { bytes: Buffer.byteLength(content) }
      }
    } catch (error: any) {
      throw new Error(`Failed to write file ${file_path}: ${error.message}`)
    }
  }
}
