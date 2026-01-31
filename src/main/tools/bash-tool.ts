import { ToolCategory, ToolDefinition } from '../../shared/types-tools'
import { z } from 'zod'
import { dbService } from '../services/DBService'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const BashSchema = z.object({
  command: z.string().describe('The shell command to execute.'),
  description: z.string().optional().describe('A brief explanation of what the command does.'),
  timeout: z.number().optional().default(120000).describe('Maximum execution time in milliseconds.')
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
  description:
    'Executes a shell command in the active workspace and returns the output (stdout and stderr).',
  category: ToolCategory.EXECUTE,
  needsApproval: true,
  parameters: BashSchema,
  execute: async (params) => {
    const { command, timeout } = BashSchema.parse(params)

    // Check for dangerous patterns
    if (DANGEROUS_PATTERNS.some((pattern) => pattern.test(command))) {
      throw new Error('Dangerous command blocked')
    }

    const workspace = dbService.getActiveWorkspace()
    const cwd = workspace?.path || process.cwd()

    try {
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
      // Re-throw with more context
      throw new Error(
        `Command failed: ${error.message}\nstdout: ${error.stdout?.trim() || ''}\nstderr: ${error.stderr?.trim() || ''}`
      )
    }
  }
}
