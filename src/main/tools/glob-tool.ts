import { glob } from 'glob'
import { workspaceManager } from '../services/WorkspaceManager'
import { ToolCategory, ToolDefinition } from '../../shared/types-tools'
import { z } from 'zod'
export async function Glob(pattern: string): Promise<string[]> {
  const workspace = workspaceManager.getActiveWorkspace()
  return await glob(pattern, { cwd: workspace?.path })
}

export const GlobTool: ToolDefinition = {
  name: 'glob',
  description: 'glob the files',
  category: ToolCategory.SEARCH,
  needsApproval: true,
  parameters: z.object({
    pattern: z.string()
  }),
  execute: async ({ pattern }) => {
    try {
      const workspace = workspaceManager.getActiveWorkspace()
      const files = await glob(pattern, { cwd: workspace?.path })
      return { success: true, data: files }
    } catch (error: any) {
      throw new Error(`Failed to glob pattern ${pattern}: ${error.message}`)
    }
  }
}
