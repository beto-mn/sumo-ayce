/**
 * Global test setup: provide the required env vars so server/utils/env.ts
 * can resolve without throwing. Tests that need specific values for the
 * optional numeric vars should set process.env in their own beforeEach
 * and call vi.resetModules() to get a fresh env singleton.
 */
Object.assign(process.env, {
  DATABASE_URL:
    process.env.DATABASE_URL ?? 'postgresql://user:pass@localhost:5432/test',
  WORDPRESS_API_URL: process.env.WORDPRESS_API_URL ?? 'https://cms.example.com',
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ?? 'ACtest',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ?? 'authtoken',
  TWILIO_WHATSAPP_NUMBER: process.env.TWILIO_WHATSAPP_NUMBER ?? '+15005550006',
  GOOGLE_SERVICE_ACCOUNT_EMAIL:
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ??
    'svc@test.iam.gserviceaccount.com',
  GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY ?? 'key',
  GOOGLE_DRIVE_FOLDER_ID: process.env.GOOGLE_DRIVE_FOLDER_ID ?? 'folder123',
  NUXT_PUBLIC_MAPBOX_ACCESS_TOKEN:
    process.env.NUXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? 'pk.test',
  BLOB_BASE_URL:
    process.env.BLOB_BASE_URL ??
    'https://abc123.public.blob.vercel-storage.com',
})
