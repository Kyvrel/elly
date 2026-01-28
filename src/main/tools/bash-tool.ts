import { ToolCategory, ToolDefinition } from "../../shared/types-tools";
import {z} from 'zod'
export const BashTool: ToolDefinition = {
    name: 'bash',
    description: 'bash tool',
    category: ToolCategory.EXECUTE,
    requiresApproval: true,
    parameters: z.object({
        
    })
}