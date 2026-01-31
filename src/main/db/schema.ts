import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { UIMessage } from 'ai'

const timestamps = {
  createdAt: int({ mode: 'timestamp' })
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: int({ mode: 'timestamp' })
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`)
}

// doc: https://orm.drizzle.team/docs/column-types/sqlite
// AI 供应商
export const providers = sqliteTable('providers', {
  id: text('id').primaryKey(),
  name: text().notNull(),
  type: text('type', { enum: ['openai', 'anthropic', 'google'] }).notNull(),
  apiKey: text('api_key').notNull(),
  baseUrl: text('base_url').notNull(),
  enabled: int({ mode: 'boolean' }).default(true),
  ...timestamps
})

export const chatThreads = sqliteTable('chat_threads', {
  id: text('id').primaryKey(),
  title: text().notNull(),
  model: text().notNull(), // 格式: "providerId/modelName"
  isGenerating: int('is_generating', { mode: 'boolean' }).default(false),
  isFavorited: int('is_favorited', { mode: 'boolean' }).default(false),
  workspaceId: text('workspace_id').references(() => workspaces.id),
  ...timestamps
})

export const chatMessages = sqliteTable('chat_messages', {
  id: text('id').primaryKey(),
  threadId: text('thread_id')
    .notNull()
    .references(() => chatThreads.id, { onDelete: 'cascade' }),
  parentId: text('parent_id'),
  message: text('message', { mode: 'json' }).$type<UIMessage>().notNull(),
  ...timestamps
})

export const appSettings = sqliteTable('app_settings', {
  id: text('id').primaryKey(),
  settingsData: text('settings_data', { mode: 'json' }).$type<Record<string, any>>().notNull(),
  ...timestamps
})

export const workspaces = sqliteTable('workspace', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  path: text('path').notNull(), // absolute path
  isActive: int('is_active', { mode: 'boolean' }).default(false),
  ...timestamps
})

export type Provider = typeof providers.$inferSelect
export type ChatThread = typeof chatThreads.$inferSelect
export type ChatMessage = typeof chatMessages.$inferSelect
export type AppSetting = typeof appSettings.$inferSelect
export type Workspace = typeof workspaces.$inferInsert
