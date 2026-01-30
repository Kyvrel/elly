import fs from 'node:fs/promises'
import { workspaceManager } from '../services/WorkspaceManager'
import { ToolCategory, ToolDefinition } from '../../shared/types-tools'
import { z } from 'zod'

const EditSchema = z.object({
  file_path: z.string().describe('file path'),
  old_string: z.string().describe('old strin'),
  new_string: z.string().describe('new string'),
  replace_all: z.boolean().optional().default(false).describe('replace all')
})

export const EditFileTool: ToolDefinition = {
  name: 'edit_file',
  description: 'edit file content',
  category: ToolCategory.EDIT,
  needPermission: true,
  parameters: EditSchema,
  execute: async (params) => {
    try {
      const { file_path, old_string, new_string, replace_all } = EditSchema.parse(params)
      const workspace = workspaceManager.getActiveWorkspace()
      if (!workspace) {
        return { success: false, error: 'No active workspace' }
      }
      const absolutePath = workspaceManager.resolvePath(file_path)
      if (!workspaceManager.isPathInWorkspace(absolutePath, workspace.id)) {
        return { success: false, error: 'File outside workspace' }
      }

      const originContent = await fs.readFile(absolutePath, 'utf-8')
      let newContent: string
      if (replace_all) {
        newContent = originContent.split(old_string).join(new_string)
      } else {
        const index = originContent.indexOf(old_string)
        if (index == -1) {
          return { success: false, error: 'string not found in file' }
        }
        newContent =
          originContent.slice(0, index) +
          new_string +
          originContent.slice(index + new_string.length)
      }
      await fs.writeFile(absolutePath, newContent, 'utf-8')
      return {
        success: true,
        data: {
          file_path: absolutePath,
          replacements: replace_all ? originContent.split(old_string).length - 1 : 1
        }
      }
    } catch (error: any) {
      throw new Error(`Failed to edit file ${params}: ${error.message}`)
    }
  }
}
