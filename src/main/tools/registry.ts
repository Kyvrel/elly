import { ToolDefinition } from '../../shared/types-tools'

export class ToolRegistry {
  private tools = new Map<string, ToolDefinition>()

  register(tool: ToolDefinition) {
    this.tools.set(tool.name, tool)
  }

  getTool(name: string) {
    return this.tools.get(name)
  }

  getAITools() {
    return Array.from(this.tools.values()).map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters.toJSONSchema()
      }
    }))
  }
}

export const toolRegister = new ToolRegistry()
