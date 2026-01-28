import path from 'path'
import { db } from '../db'
import { workspace, Workspace } from '../db/schema'
import { eq } from 'drizzle-orm'
import fs from 'fs/promises'
import { nanoid } from 'nanoid'

export class WorkspaceManager {
  private readonly SENSITIVE_PATTERNS = [
    /\.env$/,
    /\.env\..$/,
    /\.git\/config$/,
    /id_rsa$/,
    /\.ssh\//
  ]

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

  isSensitiveFile(filePath: string): boolean {
    return this.SENSITIVE_PATTERNS.some((pattern) => pattern.test(filePath))
  }

  async createWorkspace(name: string, dirPath: string) {
    const stats = await fs.stat(dirPath)
    if (!stats.isDirectory()) {
      throw new Error('path is not a directory')
    }

    const newWorkspace = {
      id: nanoid(),
      name,
      path: path.resolve(dirPath),
      isActive: false
    }

    db.insert(workspace).values(newWorkspace).run()
    return newWorkspace
  }

  setActiveWorkspace(workspaceId: string) {
    db.update(workspace).set({ isActive: false }).run()
    db.update(workspace).set({ isActive: true }).where(eq(workspace.id, workspaceId)).run()
  }
}

export const workspaceManager = new WorkspaceManager()
