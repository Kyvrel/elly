import { drizzle } from 'drizzle-orm/better-sqlite3'
import path from 'path'
import * as schema from './schema'
import Database from 'better-sqlite3'
import os from 'os'
import fs from 'fs'

function getDbPath(): string {
  console.log(process.env.NODE_ENV)
  if (process.env.NODE_ENV == 'development') {
    return './elly.db'
  }
  // Try to use Electron app if available
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { app } = require('electron')
    return path.join(app.getPath('userData'), 'elly.db')
  } catch {
    // Fallback for standalone server mode
    const dbDir = path.join(os.homedir(), '.elly')
    // Ensure directory exists
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
    }
    return path.join(dbDir, 'elly.db')
  }
}

const dbPath = getDbPath()
console.log('Database path:', dbPath)
const sqlite = new Database(dbPath)
// WAL模式: 写操作阻塞读操作(性能优化)
sqlite.pragma('journal_mode = WAL')
export const db = drizzle(sqlite, { schema })

export function initDatabase(): void {
  // Note: Database migrations should be run manually with:
  // pnpm db:generate && pnpm db:migrate
  // Don't run them from within Electron as it uses a different Node.js version
}
