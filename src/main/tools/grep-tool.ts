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
  needsApproval: false,
  parameters: GrepSchema,
  execute: async (params) => {
    try {
      const {
        pattern,
        path: searchPath,
        glob: globPattern,
        case_sensitive
      } = GrepSchema.parse(params)
      const workspace = workspaceManager.getActiveWorkspace()
      if (!workspace) {
        return { success: false, error: 'No active workspace' }
      }
      const cwd = searchPath ? workspaceManager.resolvePath(searchPath) : workspace.path
      const flags = [
        '-n', // 显示行号
        case_sensitive ? '' : '-i', // 忽略大小写
        '--color=never',
        globPattern ? `--glob "${globPattern}"` : '',
        '--max-count=100' // 限制结果数量
      ]
        .filter(Boolean)
        .join(' ')
      const command = `rg ${flags} "${pattern}" . || grep -r ${flags} "${pattern}" .`
      const { stdout } = await execAsync(command, {
        cwd,
        timeout: 30000,
        maxBuffer: 5 * 1024 * 1024
      }).catch(() => ({ stdout: '', stderr: '' })) // 没有结果时 grep 返回非 0
      const lines = stdout.trim().split('\n').filter(Boolean)
      return {
        success: true,
        data: {
          matches: lines.slice(0, 100),
          total: lines.length,
          pattern
        }
      }
    } catch (error: any) {
      // Re-throw with more context
      throw new Error(
        `Command failed: ${error.message}\nstdout: ${error.stdout?.trim() || ''}\nstderr: ${error.stderr?.trim() || ''}`
      )
    }
  }
}
