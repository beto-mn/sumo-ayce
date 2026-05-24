import { neon } from '@neondatabase/serverless'
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http'
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from '../db/schema'
import { env } from './env'

// Neon HTTP driver for production (Vercel + Neon), standard pg for local Docker
const isNeon = env.DATABASE_URL.includes('neon.tech')

// biome-ignore lint/suspicious/noExplicitAny: neon-http and node-postgres expose identical query API
export const db: any = isNeon
  ? drizzleNeon(neon(env.DATABASE_URL), { schema })
  : drizzlePg(new Pool({ connectionString: env.DATABASE_URL }), { schema })
