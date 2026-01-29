import { ToolDefinition } from '../../shared/types-tools'
import { BashTool } from './bash-tool'
import { GlobTool } from './glob-tool'
import { ReadFileTool } from './read-file-tool'
import { WriteFileTool } from './write-file-tool'
import { tool } from 'ai'

export class ToolRegistry {
  private tools = new Map<string, ToolDefinition>()

  register(tool: ToolDefinition) {
    this.tools.set(tool.name, tool)
  }

  getTool(name: string) {
    return this.tools.get(name)
  }

  getToolsForAI() {
    const aiTools: Record<string, any> = {}
    for (const [name, toolDef] of this.tools.entries()) {
      aiTools[name] = tool({
        description: toolDef.description,
        inputSchema: toolDef.parameters,
        execute: async (params) => {
          const result = await toolDef.execute(params)
          return result
        }
      })
    }
    return aiTools
  }
}

export const toolRegister = new ToolRegistry()
toolRegister.register(GlobTool)
toolRegister.register(BashTool)
toolRegister.register(ReadFileTool)
toolRegister.register(WriteFileTool)
