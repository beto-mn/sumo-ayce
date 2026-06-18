import { defineConfig } from 'drizzle-kit'

// Load .env.local for local development (Node 20.12+ built-in)
try {
  process.loadEnvFile('.env.local')
} catch {
  // file not present in CI/production — DATABASE_URL must be set in the environment
}

export default defineConfig({
  schema: './server/db/schema.ts',
  out: './server/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL as string,
  },
})
