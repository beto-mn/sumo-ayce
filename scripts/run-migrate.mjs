/**
 * Migration runner: applies pending migrations and records their SHA256 hashes
 * in __drizzle_migrations (same format drizzle-orm expects).
 *
 * Usage:
 *   DATABASE_URL=... node scripts/run-migrate.mjs           # apply pending
 *   DATABASE_URL=... node scripts/run-migrate.mjs --stamp   # only record hashes, skip SQL
 */
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const STAMP_ONLY = process.argv.includes('--stamp')

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL not set')
  process.exit(1)
}

const pool = new pg.Pool({ connectionString: url })
const client = await pool.connect()

const migrationsDir = join(__dirname, '../server/db/migrations')
const journal = JSON.parse(
  readFileSync(join(migrationsDir, 'meta/_journal.json'), 'utf8')
)
const entries = journal.entries.sort((a, b) => a.idx - b.idx)

await client.query(`
  CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
    id SERIAL PRIMARY KEY,
    hash TEXT NOT NULL UNIQUE,
    created_at BIGINT
  )
`)

// Remove stale entries (wrong hash format from previous runs)
const { rows: existing } = await client.query(
  'SELECT hash FROM "__drizzle_migrations"'
)
const existingHashes = new Set(existing.map(r => r.hash))

// Compute correct hashes for all migrations
const migrations = entries.map(entry => {
  const sqlContent = readFileSync(
    join(migrationsDir, `${entry.tag}.sql`),
    'utf8'
  )
  const hash = createHash('sha256').update(sqlContent).digest('hex')
  return { tag: entry.tag, hash, sqlContent }
})

// Remove any entries whose hash doesn't match a current file (stale)
const validHashes = new Set(migrations.map(m => m.hash))
for (const h of existingHashes) {
  if (!validHashes.has(h)) {
    await client.query('DELETE FROM "__drizzle_migrations" WHERE hash = $1', [
      h,
    ])
    console.log(`🗑️  Removed stale hash entry`)
  }
}

// Re-read applied after cleanup
const { rows: applied } = await client.query(
  'SELECT hash FROM "__drizzle_migrations"'
)
const appliedHashes = new Set(applied.map(r => r.hash))

let failed = false
for (const { tag, hash, sqlContent } of migrations) {
  if (appliedHashes.has(hash)) {
    console.log(`⏭️  SKIP (already applied): ${tag}`)
    continue
  }

  if (STAMP_ONLY) {
    await client.query(
      'INSERT INTO "__drizzle_migrations" (hash, created_at) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [hash, Date.now()]
    )
    console.log(`📌 STAMPED: ${tag}`)
    continue
  }

  const statements = sqlContent
    .split('--> statement-breakpoint')
    .map(s => s.trim())
    .filter(s => s.length > 0)

  console.log(`⏳ Applying: ${tag} (${statements.length} statements)`)

  try {
    await client.query('BEGIN')
    for (let i = 0; i < statements.length; i++) {
      try {
        await client.query(statements[i])
      } catch (err) {
        console.error(`  ❌ Statement ${i + 1}/${statements.length} failed:`)
        console.error(`     SQL: ${statements[i].slice(0, 300)}`)
        console.error(`     Error: ${err.message}`)
        if (err.detail) console.error(`     Detail: ${err.detail}`)
        if (err.hint) console.error(`     Hint:   ${err.hint}`)
        throw err
      }
    }
    await client.query(
      'INSERT INTO "__drizzle_migrations" (hash, created_at) VALUES ($1, $2)',
      [hash, Date.now()]
    )
    await client.query('COMMIT')
    console.log(`  ✅ Done`)
  } catch {
    await client.query('ROLLBACK')
    console.error(`❌ Migration ${tag} ROLLED BACK`)
    failed = true
    break
  }
}

client.release()
await pool.end()
process.exit(failed ? 1 : 0)
