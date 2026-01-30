import path from 'path'
import { db } from '../db'
import { workspaces, Workspace } from '../db/schema'
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
    return db.select().from(workspaces).where(eq(workspaces.isActive, true)).get()
  }

  resolvePath(relativePath: string): string {
    const activeWorkspace = this.getActiveWorkspace()
    if (!activeWorkspace) {
      throw new Error('No active workspace')
    }

    const resolvedPath = path.resolve(activeWorkspace.path, relativePath)
    const relativeToCwd = path.relative(activeWorkspace.path, resolvedPath)

    if (relativeToCwd.startsWith('..') || path.isAbsolute(relativeToCwd)) {
      throw new Error('Access Denied: Path traversal detected')
    }

    if (this.isSensitiveFile(resolvedPath)) {
      throw new Error('Access Denied: Sensitive file')
    }
    return resolvedPath
  }

  isSensitiveFile(filePath: string): boolean {
    return this.SENSITIVE_PATTERNS.some((pattern) => pattern.test(filePath))
  }

  isPathInWorkspace(filePath: string, workspaceId: string) {
    const workspace = db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).get()
    if (!workspace) return false
    const resolvedPath = path.resolve(filePath)
    const workspacePath = path.resolve(workspace.path)
    return resolvedPath.startsWith(workspacePath)
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

  async ensureActiveWorkspace() {
    const activeWorkspace = this.getActiveWorkspace()
    if (!activeWorkspace) {
      const cwd = process.cwd()
      const defaultWorkspace = await this.createWorkspace('Default', cwd)
      this.setActiveWorkspace(defaultWorkspace.id)
      console.log(`Created default workspace at: ${cwd}`)
    }
  }
}

export const workspaceManager = new WorkspaceManager()
