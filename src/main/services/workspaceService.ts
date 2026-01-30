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
  workspace,
  Workspace
} from '../db/schema'
import { nanoid } from 'nanoid'
import { desc } from 'drizzle-orm'

export class WorkspaceService {
  // ===== Providers =====

  getProviders() {
    const res = db.select().from(providers).all()
    return res
  }

  getProviderById(id: string): Provider | undefined {
    return db.select().from(providers).where(eq(providers.id, id)).get()
  }

  upsertProviders(provider: Omit<Provider, 'createdAt' | 'updatedAt'>) {
    const now = new Date()
    db.insert(providers)
      .values({ ...provider, createdAt: now, updatedAt: now })
      .onConflictDoUpdate({ target: providers.id, set: { ...provider, updatedAt: now } })
      .run()
  }

  deleteProvider(id: string) {
    db.delete(providers).where(eq(providers.id, id)).run()
  }

  // ===== Threads =====
  getAllThreads() {
    return db.select().from(chatThreads).orderBy(desc(chatThreads.createdAt)).all()
  }

  getThreadsById(id: string): ChatThread | undefined {
    return db.select().from(chatThreads).where(eq(chatThreads.id, id)).get()
  }

  createThreads(title: string, model: string) {
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

  updateThread(id: string, updates: Partial<Omit<ChatThread, 'id' | 'createdAt'>>) {
    const now = new Date()
    return db
      .update(chatThreads)
      .set({ ...updates, updatedAt: now })
      .where(eq(chatThreads.id, id))
      .run()
  }
  deleteThread(id: string) {
    db.delete(chatThreads).where(eq(chatThreads.id, id)).run()
  }

  // ===== Messages =====

  getMessagesByThreadId(threadId: string) {
    console.log('[getMessagesByThreadId] threadId:', threadId)
    return db.select().from(chatMessages).where(eq(chatMessages.threadId, threadId)).all()
  }

  insertMessage(msg: Omit<ChatMessage, 'id' | 'createdAt' | 'updatedAt'>): ChatMessage {
    const now = new Date()
    const messsage = { id: nanoid(), ...msg, createdAt: now, updatedAt: now }
    db.insert(chatMessages).values(messsage).run()
    return messsage
  }

  // ===== Settings =====

  getSettings() {
    const result = db.select().from(appSettings).where(eq(appSettings.id, 'default')).get()
    return result?.settingsData || {}
  }

  updateSettings(setting: Record<string, any>) {
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

  getAllWorkspaces() {
    return db.select().from(workspace).all()
  }

  getWorkspaceById(id: string): Workspace | undefined {
    return db.select().from(workspace).where(eq(workspace.id, id)).get()
  }

  getActiveWorkspace(): Workspace | undefined {
    return db.select().from(workspace).where(eq(workspace.isActive, true)).get()
  }
}

export const workspaceService = new WorkspaceService()
