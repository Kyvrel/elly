import { eq } from 'drizzle-orm'
import { db } from '../db'
import { appSettings } from '../db/schema'

export class WorkspaceService {
  getSettings() {
    const result = db.select().from(appSettings).where(eq(appSettings.id, 'default')).get()
    return result?.settingsData || {}
  }
}

export const workspaceService = new WorkspaceService()
