import { EventEmitter } from 'events'
import { ToolDefinition } from '../../shared/types-tools'
import { nanoid } from 'nanoid'
import { TIMEOUT } from 'dns'

export enum ApprovalDecision {
  APPROVE_ONCE = 'approve_once',
  APPROVE_ALL = 'approve_all',
  DENY = 'deny'
}

interface PermissionRequest {
  id: string
  toolName: string
  params: any
  timestamp: number
}

export const PERMISSION_EVENTS = {
  REQUIRED: 'permission-required'
} as const

const decisionEvent = (requestId: string): string => `decision-${requestId}`

export class PermissionManager extends EventEmitter {
  private pendingRequests = new Map<string, PermissionRequest>()
  private autoApprovals = new Set<string>()

  requestPermission(tool: ToolDefinition, params: any): Promise<boolean> | boolean {
    if (!tool.needsApproval) return true

    if (this.autoApprovals.has(tool.name)) {
      return true
    }

    const requestId = `perm-${Date.now()}-${nanoid(6)}`
    const request: PermissionRequest = {
      id: requestId,
      toolName: tool.name,
      params: params,
      timestamp: Date.now()
    }

    this.pendingRequests.set(requestId, request)
    // notify the uid via event
    this.emit(PERMISSION_EVENTS.REQUIRED, request)

    return new Promise((resolve) => {
      const TIMEOUT_MS = 60_000
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(requestId)
        this.removeAllListeners(decisionEvent(requestId))
      }, TIMEOUT_MS)
      // listen for a specific event for this request
      this.once(decisionEvent(requestId), (decision: ApprovalDecision) => {
        clearTimeout(timeoutId)
        this.pendingRequests.delete(requestId)
        switch (decision) {
          case ApprovalDecision.APPROVE_ALL:
            this.autoApprovals.add(tool.name)
            resolve(true)
            break
          case ApprovalDecision.APPROVE_ONCE:
            resolve(true)
            break
          default:
            resolve(false)
        }
      })
    })
  }

  // called by ui when the user clicks a button
  handleDecision(requestId: string, decision: ApprovalDecision): void {
    this.emit(decisionEvent(requestId), decision)
  }

  getLatestPendingRequest(): PermissionRequest | null {
    const values = Array.from(this.pendingRequests.values())
    return values.length > 0 ? values[values.length - 1] : null
  }

  resetAutoApprovals(): void {
    this.autoApprovals.clear()
  }
}

export const permissionManager = new PermissionManager()
