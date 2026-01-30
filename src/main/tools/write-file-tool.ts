import { writeFile, mkdir } from 'node:fs/promises'
import { workspaceManager } from '../services/WorkspaceManager'
import { ToolCategory, ToolDefinition } from '../../shared/types-tools'
import { z } from 'zod'
import { dirname } from 'node:path'

export const WriteFileTool: ToolDefinition = {
  name: 'write_file',
  description: 'Write content to a file. Overwrites if exists.',
  category: ToolCategory.WRITE,
  needPermission: true, // Must be TRUE for write
  parameters: z.object({
    file_path: z.string(),
    content: z.string()
  }),
  execute: async ({ file_path, content }) => {
    const absolutePath = workspaceManager.resolvePath(file_path)
    await mkdir(dirname(absolutePath), { recursive: true })
    await writeFile(absolutePath, content, 'utf-8')
    return {
      success: true,
      data: { written: true, path: file_path },
      metadata: { bytes: Buffer.byteLength(content) }
    }
  }
}
