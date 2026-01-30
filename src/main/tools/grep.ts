import { ToolCategory, ToolDefinition } from '../../shared/types-tools'
import { z } from 'zod'
import { workspaceManager } from '../services/WorkspaceManager'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const GrepSchema = z.object({
  pattern: z.string().describe('搜索模式，支持正则'),
  path: z.string().optional().describe('搜索路径，默认工作区'),
  glob: z.string().optional().describe('文件类型过滤（如 "*.ts'),
  case_sensitive: z.boolean().optional().default(true).describe('是否大小写敏感')
})



export const GrepTool: ToolDefinition = {
  name: 'grep',
  description: 'grep tool',
  category: ToolCategory.SEARCH,
  needPermission: false,
  parameters: GrepSchema,
  execute: async (params) => {
    const { pattern, path, glob, caseSensitive } = GrepSchema.parse(params)
    // TODO
    } catch (error: any) {
      // Re-throw with more context
      throw new Error(
        `Command failed: ${error.message}\nstdout: ${error.stdout?.trim() || ''}\nstderr: ${error.stderr?.trim() || ''}`
      )
    }
  }
}
