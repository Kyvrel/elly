import path from 'node:path'
import process from 'node:process'
import { DatabaseSync } from 'node:sqlite'

type SeedArgs = {
  dbPath: string
  reset: boolean
}

function printHelp() {
  console.log(
    `
Seed test data into the local SQLite database.

Usage:
  pnpm tsx scripts/seed-test-data.ts [--db <path>] [--reset]

Options:
  --db <path>   Database file path (default: ./elly.db)
  --reset       Delete old seeded rows (ids start with "seed_")
  --help        Show help
`.trim()
  )
}

function parseArgs(argv: string[]): SeedArgs {
  const args: SeedArgs = { dbPath: './elly.db', reset: false }

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--') continue
    if (a === '--help' || a === '-h') {
      printHelp()
      process.exit(0)
    }
    if (a === '--reset') {
      args.reset = true
      continue
    }
    if (a === '--db') {
      const v = argv[i + 1]
      if (!v) {
        console.error('Missing value for --db')
        process.exit(1)
      }
      args.dbPath = v
      i++
      continue
    }

    console.error(`Unknown arg: ${a}`)
    printHelp()
    process.exit(1)
  }

  return args
}

function requireTables(db: DatabaseSync) {
  const stmt = db.prepare(
    `select name from sqlite_master where type = 'table' and name not like 'sqlite_%'`
  )
  const rows = stmt.all() as Array<{ name: string }>
  const names = new Set(rows.map((r) => r.name))

  const required = ['providers', 'chat_threads', 'chat_messages', 'app_settings']
  const missing = required.filter((t) => !names.has(t))
  if (missing.length) {
    console.error(`Missing tables: ${missing.join(', ')}`)
    console.error('Please run: pnpm db:generate && pnpm db:migrate')
    process.exit(1)
  }
}

function countRows(db: DatabaseSync, table: string) {
  const row = db.prepare(`select count(*) as c from ${table}`).get() as { c: number }
  return row.c
}

function readSingleValue(row: unknown): string | undefined {
  if (!row || typeof row !== 'object') return undefined
  const values = Object.values(row as Record<string, unknown>)
  const v = values[0]
  return typeof v === 'string' ? v : v == null ? undefined : String(v)
}

function checkDatabaseHealth(db: DatabaseSync) {
  try {
    const rows = db.prepare('pragma quick_check').all() as Array<Record<string, unknown>>
    const first = readSingleValue(rows[0])
    if (first && first !== 'ok') {
      console.error('Database quick_check failed.')
      console.error('First error:', first)
      console.error('Tip: close the running Electron app, then rebuild the db.')
      console.error(
        'Rebuild steps: rm -f elly.db elly.db-wal elly.db-shm && pnpm db:migrate && pnpm db:seed'
      )
      process.exit(1)
    }
  } catch (e: any) {
    console.error('Cannot read the database (quick_check failed).')
    console.error('This often means the db is corrupted or another process is using it.')
    console.error('Tip: close the running Electron app, then rebuild the db.')
    console.error(
      'Rebuild steps: rm -f elly.db elly.db-wal elly.db-shm && pnpm db:migrate && pnpm db:seed'
    )
    if (e?.message) console.error('Error:', e.message)
    process.exit(1)
  }
}

const { dbPath, reset } = parseArgs(process.argv.slice(2))
const resolvedDbPath = path.resolve(process.cwd(), dbPath)

const db = new DatabaseSync(resolvedDbPath)
db.exec('PRAGMA foreign_keys = ON;')
db.exec('PRAGMA journal_mode = WAL;')
db.exec('PRAGMA busy_timeout = 5000;')

requireTables(db)
checkDatabaseHealth(db)

if (reset) {
  try {
    db.exec('BEGIN;')
    db.prepare("delete from chat_threads where id like 'seed_%'").run()
    db.prepare("delete from providers where id like 'seed_%'").run()
    db.exec('COMMIT;')
  } catch (e) {
    db.exec('ROLLBACK;')
    throw e
  }
}

try {
  db.exec('BEGIN;')

  const settingsJson = JSON.stringify({
    seeded: true,
    seededAt: new Date().toISOString(),
    example: { hello: 'world' }
  })

  db.prepare(
    `
    insert into app_settings (id, settings_data)
    values ('default', ?)
    on conflict(id) do update set
      settings_data = excluded.settings_data,
      updatedAt = CURRENT_TIMESTAMP
  `.trim()
  ).run(settingsJson)

  db.prepare(
    `
    insert into providers (id, name, type, api_key, base_url, enabled)
    values (?, ?, ?, ?, ?, ?)
    on conflict(id) do update set
      name = excluded.name,
      type = excluded.type,
      api_key = excluded.api_key,
      base_url = excluded.base_url,
      enabled = excluded.enabled,
      updatedAt = CURRENT_TIMESTAMP
  `.trim()
  ).run('seed_openai', 'OpenAI (test)', 'openai', 'test-openai-key', 'https://api.openai.com/v1', 1)

  db.prepare(
    `
    insert into providers (id, name, type, api_key, base_url, enabled)
    values (?, ?, ?, ?, ?, ?)
    on conflict(id) do update set
      name = excluded.name,
      type = excluded.type,
      api_key = excluded.api_key,
      base_url = excluded.base_url,
      enabled = excluded.enabled,
      updatedAt = CURRENT_TIMESTAMP
  `.trim()
  ).run(
    'seed_anthropic',
    'Anthropic (test)',
    'anthropic',
    'test-anthropic-key',
    'https://api.anthropic.com',
    1
  )

  db.prepare(
    `
    insert into chat_threads (id, title, model, is_generating, is_favorited)
    values (?, ?, ?, ?, ?)
    on conflict(id) do update set
      title = excluded.title,
      model = excluded.model,
      is_generating = excluded.is_generating,
      is_favorited = excluded.is_favorited,
      updatedAt = CURRENT_TIMESTAMP
  `.trim()
  ).run('seed_thread_1', 'Seed: Hello', 'seed_openai/gpt-4o-mini', 0, 1)

  db.prepare(
    `
    insert into chat_threads (id, title, model, is_generating, is_favorited)
    values (?, ?, ?, ?, ?)
    on conflict(id) do update set
      title = excluded.title,
      model = excluded.model,
      is_generating = excluded.is_generating,
      is_favorited = excluded.is_favorited,
      updatedAt = CURRENT_TIMESTAMP
  `.trim()
  ).run('seed_thread_2', 'Seed: Short story', 'seed_anthropic/claude-3-5-sonnet', 0, 0)

  const messageStmt = db.prepare(
    `
    insert into chat_messages (id, thread_id, parent_id, message)
    values (?, ?, ?, ?)
    on conflict(id) do update set
      thread_id = excluded.thread_id,
      parent_id = excluded.parent_id,
      message = excluded.message,
      updatedAt = CURRENT_TIMESTAMP
  `.trim()
  )

  messageStmt.run(
    'seed_msg_1',
    'seed_thread_1',
    null,
    JSON.stringify({ role: 'user', content: 'Hi! Please say hello.' })
  )
  messageStmt.run(
    'seed_msg_2',
    'seed_thread_1',
    'seed_msg_1',
    JSON.stringify({ role: 'assistant', content: 'Hello! Nice to meet you.' })
  )
  messageStmt.run(
    'seed_msg_3',
    'seed_thread_2',
    null,
    JSON.stringify({ role: 'user', content: 'Write a short story about a cat.' })
  )
  messageStmt.run(
    'seed_msg_4',
    'seed_thread_2',
    'seed_msg_3',
    JSON.stringify({
      role: 'assistant',
      content: 'A small cat walked under the moon and found a warm home.'
    })
  )

  db.exec('COMMIT;')
} catch (e) {
  db.exec('ROLLBACK;')
  throw e
}

console.log('Seed done:', resolvedDbPath)
console.log('providers:', countRows(db, 'providers'))
console.log('chat_threads:', countRows(db, 'chat_threads'))
console.log('chat_messages:', countRows(db, 'chat_messages'))
console.log('app_settings:', countRows(db, 'app_settings'))

db.close()
