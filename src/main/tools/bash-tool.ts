import { ToolCategory, ToolDefinition } from '../../shared/types-tools'
import { z } from 'zod'
import { workspaceManager } from '../services/WorkspaceManager'
import { exec } from 'child_process'
import { promisify } from 'util'
import { stderr, stdout } from 'process'

const execAsync = promisify(exec)

const BashSchema = z.object({
  command: z.string().describe('bash command'),
  description: z.string().optional().describe('usage for this command'),
  timeout: z.number().optional().default(120000).describe('timeout')
})

const DANGEROUS_PATTERNS = [
  /rm\s+-rf\s+\//, // rm -rf /
  /:\(\)\{.*\}/, // Fork bomb
  /mkfs/, // Format disk
  /dd\s+if=/, // Disk operations
  />\s*\/dev\/sd/, // Write to disk
  /sudo\s+rm/ // sudo rm
]

export const BashTool: ToolDefinition = {
  name: 'bash',
  description: 'bash tool',
  category: ToolCategory.EXECUTE,
  needPermission: true,
  parameters: BashSchema,
  execute: async (params) => {
    try {
      const { command, timeout } = BashSchema.parse(params)
      if (DANGEROUS_PATTERNS.some((pattern) => pattern.test(command))) {
        return { success: false, error: 'Dangerous command blocked' }
      }
      const workspace = workspaceManager.getActiveWorkspace()
      const cwd = workspace?.path || process.cwd()

      const { stdout, stderr } = await execAsync(command, {
        cwd,
        timeout,
        maxBuffer: 10 * 1024 * 1024 // 10M
      })
      return {
        success: true,
        data: {
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exit_code: 0
        },
        metadata: {
          command,
          cwd
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        data: {
          stdout: error.stdout?.trim() || '',
          stderr: error.stderr?.trim() || '',
          exit_code: error.code || 1
        }
      }
    }
  }
}
