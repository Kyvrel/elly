import path from 'path'
import { db } from '../db'
import { workspace, Workspace } from '../db/schema'
import { eq } from 'drizzle-orm'

export class WorkspaceManager {
  getActiveWorkspace(): Workspace | undefined {
    return db.select().from(workspace).where(eq(workspace.isActive, true)).get()
  }

  resolvePath(relativePath: string): string {
    const activeWorkspace = this.getActiveWorkspace()
    if (!activeWorkspace) {
      throw new Error('No active workspace')
    }

    const resolvedPath = path.resolve(activeWorkspace.path, relativePath)
    if (!resolvedPath.startsWith(activeWorkspace.path)) {
      throw new Error('Access Denied: Path traversal detected')
    }
    return resolvedPath
  }
}

export const workspaceManager = new WorkspaceManager()
