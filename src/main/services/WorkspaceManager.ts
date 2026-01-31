import path from 'path'
import os from 'os'
import { Workspace } from '../db/schema'
import fs from 'fs/promises'
import { dbService } from './DBService'

export class WorkspaceManager {
  private readonly SENSITIVE_PATTERNS = [
    /\.env$/,
    /\.env\..$/,
    /\.git\/config$/,
    /id_rsa$/,
    /\.ssh\//
  ]

  resolvePath(relativePath: string): string {
    const activeWorkspace = dbService.workspace.getActiveWorkspace()
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

  isPathInWorkspace(filePath: string, workspaceId: string): boolean {
    const workspace = dbService.workspace.getWorkspaceById(workspaceId)
    if (!workspace) return false
    const resolvedPath = path.resolve(filePath)
    const workspacePath = path.resolve(workspace.path)
    return resolvedPath.startsWith(workspacePath)
  }

  async createWorkspace(name: string, dirPath: string): Promise<Workspace> {
    const stats = await fs.stat(dirPath)
    if (!stats.isDirectory()) {
      throw new Error('path is not a directory')
    }

    const workspacePath = path.resolve(dirPath)
    return dbService.workspace.createWorkspace(name, workspacePath)
  }

  async ensureActiveWorkspace(): Promise<void> {
    const activeWorkspace = dbService.workspace.getActiveWorkspace()
    if (!activeWorkspace) {
      const defaultPath = path.join(
        os.homedir(),
        'Library',
        'Application Support',
        'alma',
        'workspaces',
        'default'
      )
      await fs.mkdir(defaultPath, { recursive: true })
      const defaultWorkspace = await this.createWorkspace('Default', defaultPath)
      dbService.workspace.setActiveWorkspace(defaultWorkspace.id)
      console.log(`Created default workspace at: ${defaultPath}`)
    }
  }
}

export const workspaceManager = new WorkspaceManager()
