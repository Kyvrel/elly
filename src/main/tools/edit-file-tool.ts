import fs from 'node:fs/promises'
import { workspaceManager } from '../services/WorkspaceManager'
import { dbService } from '../services/DBService'
import { ToolCategory, ToolDefinition } from '../../shared/types-tools'
import { z } from 'zod'

const EditSchema = z.object({
  filePath: z.string().describe('Relative or absolute path to the file.'),
  oldString: z.string().describe('The specific text to search for in the file.'),
  newString: z.string().describe('The replacement text.'),
  replaceAll: z
    .boolean()
    .optional()
    .default(false)
    .describe('If true, replaces all occurrences; if false, only the first.')
})

export const EditFileTool: ToolDefinition = {
  name: 'edit_file',
  description:
    'Edits a file by replacing a specific string with a new string. Requires the old string to exist in the file.',
  category: ToolCategory.EDIT,
  needsApproval: true,
  parameters: EditSchema,
  execute: async (params) => {
    try {
      const { filePath, oldString, newString, replaceAll } = EditSchema.parse(params)
      const workspace = dbService.getActiveWorkspace()
      if (!workspace) {
        return { success: false, error: 'No active workspace' }
      }
      const absolutePath = workspaceManager.resolvePath(filePath)
      if (!workspaceManager.isPathInWorkspace(absolutePath, workspace.id)) {
        return { success: false, error: 'File outside workspace' }
      }
      if (workspaceManager.isSensitiveFile(absolutePath)) {
        return { success: false, error: 'Cannot write to sensitive file' }
      }

      const originContent = await fs.readFile(absolutePath, 'utf-8')
      let newContent: string
      if (replaceAll) {
        newContent = originContent.split(oldString).join(newString)
      } else {
        const index = originContent.indexOf(oldString)
        if (index == -1) {
          return { success: false, error: 'string not found in file' }
        }
        newContent =
          originContent.slice(0, index) + newString + originContent.slice(index + oldString.length)
      }
      await fs.writeFile(absolutePath, newContent, 'utf-8')
      return {
        success: true,
        data: {
          filePath: absolutePath,
          replacements: replaceAll ? originContent.split(oldString).length - 1 : 1
        }
      }
    } catch (error: any) {
      throw new Error(`Failed to edit file ${params}: ${error.message}`)
    }
  }
}
