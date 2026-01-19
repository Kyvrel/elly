import { drizzle } from 'drizzle-orm/better-sqlite3';
import path from 'path';
import { app } from 'electron'
import * as schema from './schema'
import Database from 'better-sqlite3';


const dbPath = path.join(app.getPath("userData"), 'elly.db')
console.log(dbPath)
const sqlite = new Database(dbPath)
// WAL模式: 写操作阻塞读操作(性能优化)
sqlite.pragma('journal_mode = WAL');
export const db = drizzle(sqlite, { schema });
