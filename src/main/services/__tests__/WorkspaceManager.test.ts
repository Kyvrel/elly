import { describe, it, expect, vi, beforeEach } from 'vitest'
import path from 'path'
import { WorkspaceManager } from '../WorkspaceManager'

// Mock the database
vi.mock('../db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    get: vi.fn()
  }
}))

describe('WorkspaceManager', () => {
  let manager: WorkspaceManager
  // Mock workspace located in /tmp/test-workspace
  const MOCK_WORKSPACE_ROOT = path.resolve('/tmp/test-workspace')

  beforeEach(() => {
    manager = new WorkspaceManager()

    // Hack: We can mock the getActiveWorkspace method directly if we want,
    // or mock the DB response. specific implementation depends on how we write the class.
    // For TDD, let's assume we can spy on getActiveWorkspace
    vi.spyOn(manager, 'getActiveWorkspace').mockReturnValue({
      id: 'test-id',
      name: 'Test Workspace',
      path: MOCK_WORKSPACE_ROOT,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    } as any)
  })

  describe('resolvePath', () => {
    it('should resolve a valid relative path inside workspace', () => {
      const result = manager.resolvePath('src/main.ts')
      expect(result).toBe(path.join(MOCK_WORKSPACE_ROOT, 'src/main.ts'))
    })

    it('should block path traversal attempts (../)', () => {
      expect(() => {
        manager.resolvePath('../../etc/passwd')
      }).toThrow(/Access Denied/)
    })

    it('should block absolute paths outside workspace', () => {
      expect(() => {
        manager.resolvePath('/etc/passwd')
      }).toThrow(/Access Denied/)
    })

    it('should allow nested paths inside workspace', () => {
      const result = manager.resolvePath('src/components/Button.tsx')
      expect(result).toBe(path.join(MOCK_WORKSPACE_ROOT, 'src/components/Button.tsx'))
    })
  })
})
