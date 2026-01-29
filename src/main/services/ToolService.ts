import { toolRegister } from '../tools/registry'
import { permissionManager } from './PermissionManager'

export class ToolService {
  async callTool(name: string, args: any) {
    const tool = toolRegister.getTool(name)
    if (!tool) throw new Error(`Tool ${name} not found`)

    const permitted = await permissionManager.requestPermission(tool, args)
    if (!permitted) {
      throw new Error(`User denied this operation!`)
    }
    return tool.execute(args)
  }
}

export const toolService = new ToolService()