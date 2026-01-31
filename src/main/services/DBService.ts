import { eq } from 'drizzle-orm'
import { db } from '../db'
import {
  appSettings,
  ChatMessage,
  chatMessages,
  ChatThread,
  chatThreads,
  Provider,
  providers,
  workspaces,
  Workspace
} from '../db/schema'
import { nanoid } from 'nanoid'
import { desc } from 'drizzle-orm'
import { UIMessage } from 'ai'

export class DBService {
  // ===== Providers =====

  getProviders(): Provider[] {
    const res = db.select().from(providers).all()
    return res
  }

  getProviderById(id: string): Provider | undefined {
    return db.select().from(providers).where(eq(providers.id, id)).get()
  }

  upsertProviders(provider: Omit<Provider, 'createdAt' | 'updatedAt'>): void {
    const now = new Date()
    db.insert(providers)
      .values({ ...provider, createdAt: now, updatedAt: now })
      .onConflictDoUpdate({ target: providers.id, set: { ...provider, updatedAt: now } })
      .run()
  }

  deleteProvider(id: string): void {
    db.delete(providers).where(eq(providers.id, id)).run()
  }

  // ===== Threads =====
  getAllThreads(): ChatThread[] {
    return db.select().from(chatThreads).orderBy(desc(chatThreads.createdAt)).all()
  }

  getThreadsById(id: string): ChatThread | undefined {
    return db.select().from(chatThreads).where(eq(chatThreads.id, id)).get()
  }

  createThreads(title: string, model: string): ChatThread {
    const now = new Date()
    const thread: ChatThread = {
      id: nanoid(),
      title,
      model,
      isGenerating: false,
      isFavorited: false,
      workspaceId: null,
      createdAt: now,
      updatedAt: now
    }

    db.insert(chatThreads).values(thread).run()
    return thread
  }

  updateThread(id: string, updates: Partial<Omit<ChatThread, 'id' | 'createdAt'>>): any {
    const now = new Date()
    return db
      .update(chatThreads)
      .set({ ...updates, updatedAt: now })
      .where(eq(chatThreads.id, id))
      .run()
  }

  deleteThread(id: string): void {
    db.delete(chatThreads).where(eq(chatThreads.id, id)).run()
  }

  // ===== Messages =====

  getMessagesByThreadId(threadId: string): ChatMessage[] {
    console.log('[getMessagesByThreadId] threadId:', threadId)
    return db.select().from(chatMessages).where(eq(chatMessages.threadId, threadId)).all()
  }

  insertMessage(msg: Omit<ChatMessage, 'createdAt' | 'updatedAt'>): ChatMessage {
    const now = new Date()
    const messsage = { ...msg, createdAt: now, updatedAt: now }
    db.insert(chatMessages).values(messsage).run()
    return messsage
  }

  updateMessage(id: string, message: UIMessage): ChatMessage | undefined {
    db.update(chatMessages)
      .set({ message, updatedAt: new Date() })
      .where(eq(chatMessages.id, id))
      .run()
    return db.select().from(chatMessages).where(eq(chatMessages.id, id)).get()
  }

  // ===== Settings =====

  getSettings(): any {
    const result = db.select().from(appSettings).where(eq(appSettings.id, 'default')).get()
    return result?.settingsData || {}
  }

  updateSettings(setting: Record<string, any>): void {
    const now = new Date()
    db.insert(appSettings)
      .values({
        id: 'default',
        settingsData: setting,
        createdAt: now,
        updatedAt: now
      })
      .onConflictDoUpdate({
        target: appSettings.id,
        set: { settingsData: setting, updatedAt: now }
      })
      .run()
  }

  // ===== Workspaces =====

  getAllWorkspaces(): Workspace[] {
    return db.select().from(workspaces).all()
  }

  getWorkspaceById(id: string): Workspace | undefined {
    return db.select().from(workspaces).where(eq(workspaces.id, id)).get()
  }

  getActiveWorkspace(): Workspace | undefined {
    return db.select().from(workspaces).where(eq(workspaces.isActive, true)).get()
  }

  createWorkspace(name: string, workspacePath: string): Workspace {
    const newWorkspace: Workspace = {
      id: nanoid(),
      name,
      path: workspacePath,
      isActive: false
    }

    db.insert(workspaces).values(newWorkspace).run()
    return newWorkspace
  }

  setActiveWorkspace(workspaceId: string): void {
    db.update(workspaces).set({ isActive: false }).run()
    db.update(workspaces).set({ isActive: true }).where(eq(workspaces.id, workspaceId)).run()
  }
}

export const dbService = new DBService()
