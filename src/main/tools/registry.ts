import { ToolDefinition } from '../../shared/types-tools'
import { BashTool } from './bash-tool'
import { GlobTool } from './glob-tool'
import { ReadFileTool } from './read-file-tool'
import { WriteFileTool } from './write-file-tool'
import { tool } from 'ai'
import { permissionManager } from '../services/PermissionManager'
import { EditFileTool } from './edit-file-tool'
import { GrepTool } from './grep-tool'

export class ToolRegistry {
  private tools = new Map<string, ToolDefinition>()
  constructor() {
    this.register(ReadFileTool)
    this.register(WriteFileTool)
    this.register(EditFileTool)
    this.register(BashTool)
    this.register(GlobTool)
    this.register(GrepTool)
  }

  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool)
  }

  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name)
  }

  getToolsForAI(): Record<string, any> {
    const aiTools: Record<string, any> = {}
    for (const [name, toolDef] of this.tools.entries()) {
      aiTools[name] = tool({
        description: toolDef.description,
        inputSchema: toolDef.parameters,
        execute: async (params) => {
          // Request permission before executing
          if (toolDef.needsApproval) {
            const approved = await permissionManager.requestPermission(toolDef, params)
            if (!approved) {
              throw new Error('Permission denied by user')
            }
          }

          // Execute the tool
          const result = await toolDef.execute(params)
          return result
        }
      })
    }
    return aiTools
  }
}

export const toolRegister = new ToolRegistry()
