import { glob } from 'glob'
import { workspaceManager } from '../services/WorkspaceManager'
import { dbService } from '../services/DBService'
import { ToolCategory, ToolDefinition } from '../../shared/types-tools'
import { z } from 'zod'
export async function Glob(pattern: string): Promise<string[]> {
  const workspace = dbService.workspace.getActiveWorkspace()
  return await glob(pattern, { cwd: workspace?.path })
}

const GlobSchema = z.object({
  pattern: z.string().describe('The glob pattern to match against file paths.'),
  path: z.string().optional().describe('搜索目录（默认工作区根目录）')
})

export const GlobTool: ToolDefinition = {
  name: 'glob',
  description:
    'Finds files matching a glob pattern (e.g., "**/*.ts") within the current workspace.',
  category: ToolCategory.SEARCH,
  needsApproval: true,
  parameters: GlobSchema,
  execute: async (params) => {
    try {
      const { pattern, path: searchPath } = GlobSchema.parse(params)
      const workspace = dbService.workspace.getActiveWorkspace()
      if (!workspace) {
        return { success: false, error: 'No active workspace' }
      }
      const cwd = searchPath ? workspaceManager.resolvePath(searchPath) : workspace.path
      const files = await glob(pattern, {
        cwd: cwd,
        ignore: ['node_modules/**', '.git/**'],
        nodir: true
      })
      return { success: true, data: { files: files.slice(0, 100), total: files.length, pattern } }
    } catch (error: any) {
      throw new Error(`Failed to glob pattern ${params}: ${error.message}`)
    }
  }
}
