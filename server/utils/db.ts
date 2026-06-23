import { neon } from '@neondatabase/serverless'
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http'
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from '../db/schema'
import { env } from './env'

// Lazy singleton — deferred so the Nitro prerenderer can initialize without
// DATABASE_URL being present (static/ISR pages don't need the DB at build time).
// biome-ignore lint/suspicious/noExplicitAny: neon-http and node-postgres expose identical query API
let _db: any

// biome-ignore lint/suspicious/noExplicitAny: see above
function getDb(): any {
  if (_db) return _db
  const isNeon = env.DATABASE_URL.includes('neon.tech')
  _db = isNeon
    ? drizzleNeon(neon(env.DATABASE_URL), { schema })
    : drizzlePg(new Pool({ connectionString: env.DATABASE_URL }), { schema })
  return _db
}

// biome-ignore lint/suspicious/noExplicitAny: see above
export const db: any = new Proxy(
  {},
  {
    get(_, key: string | symbol) {
      const instance = getDb()
      const val = instance[key]
      if (typeof val === 'function') return val.bind(instance)
      return val
    },
  }
)
