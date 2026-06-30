# Vercel Blob — Menu Image Management

This document covers the complete workflow for managing menu images stored in
Vercel Blob Storage. After reading it you can upload a new image and see it on
the menu without touching code.

---

## Path convention

Every image stored in Blob follows this pattern:

```
menu/<folder>/<filename>
```

No leading slash. No base URL. No subdirectories beyond `<folder>`.

| Folder | Content |
|---|---|
| `menu/ayce/` | AYCE menu items (rolls, burgers, etc.) |
| `menu/ala-carta/` | À-la-carte items |
| `menu/express/` | Express menu items |
| `menu/kids/` | Kids menu items |
| `menu/desserts/` | Desserts |
| `menu/drinks/` | Drinks (cocktails, sodas, coffee, etc.) |
| `menu/sauces/` | Sauce images |

Examples of valid paths:

```
menu/ayce/mixed_yakimeshi.webp
menu/sauces/bbq.webp
menu/drinks/mojito.webp
```

Store the path above (not the full URL) in the `file_name` column of
`menu_items` or `sauces`. The API assembles the full URL at runtime by
prefixing `BLOB_BASE_URL`.

---

## Environment variables

### BLOB_BASE_URL (required, server-side only)

The public base URL of the Blob store. Find it in the Vercel Dashboard:

1. Open the project in [vercel.com](https://vercel.com).
2. Go to **Storage** → select the Blob store.
3. Copy the **Public URL** field (e.g., `https://abc123xyz.public.blob.vercel-storage.com`).

Set it in your local `.env.local`:

```
BLOB_BASE_URL=https://abc123xyz.public.blob.vercel-storage.com
```

And in the Vercel project environment variables for preview and production.

This variable is **not** exposed to the browser. It is server-side only and
does NOT use the `NUXT_PUBLIC_` prefix.

### BLOB_READ_WRITE_TOKEN (for uploads only, never committed)

Required when uploading images via the Vercel CLI or SDK. Find it in the same
Vercel Dashboard page (Storage → Blob store → Tokens). Do not commit this
token. Add it to your shell environment or `.env.local` temporarily:

```
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

---

## Uploading a new image

### Option A: Vercel Dashboard (simplest)

1. Go to **Vercel Dashboard** → **Storage** → select the Blob store.
2. Click **Upload**.
3. Upload the `.webp` file.
4. After upload, rename or move the file so its path matches the convention
   (`menu/<folder>/<filename>.webp`). Use the dashboard file browser.
5. Copy the relative path (the part after the base URL).
6. Update `file_name` in the database (see DB Update Procedure below).

### Option B: Vercel CLI

Install the CLI if you haven't:

```bash
pnpm add -g vercel
vercel login
```

Upload a single file:

```bash
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_... \
  vercel blob upload public/menu/ayce/new_item.webp \
  --store <store-id> \
  --pathname menu/ayce/new_item.webp
```

The `--pathname` flag sets the exact path stored in Blob. It must match the
convention so the `file_name` column can reference it directly.

### Option C: Bulk initial upload script

If you are migrating the full `public/menu/` directory to Blob for the first
time, use the following one-off script. Install `@vercel/blob` temporarily:

```bash
pnpm add -D @vercel/blob
```

Create `scripts/upload-blob.mjs`:

```js
import { put } from '@vercel/blob'
import { readdirSync, readFileSync } from 'fs'
import { join, relative } from 'path'

const baseDir = 'public/menu'

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true })
  return entries.flatMap(entry => {
    const fullPath = join(dir, entry.name)
    return entry.isDirectory() ? walk(fullPath) : [fullPath]
  })
}

for (const file of walk(baseDir)) {
  const blobPath = 'menu/' + relative(baseDir, file)
  const content = readFileSync(file)
  const result = await put(blobPath, content, { access: 'public' })
  console.log('uploaded', result.url)
}
```

Run it:

```bash
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_... node scripts/upload-blob.mjs
```

Remove the script and the `@vercel/blob` dev dependency after the migration
is complete.

---

## DB update procedure

After uploading an image, update the `file_name` column in Neon.

### Via psql

```bash
psql "$DATABASE_URL" -c \
  "UPDATE menu_items SET file_name='menu/ayce/new_item.webp' WHERE name_es='New Item';"
```

### Via Drizzle Studio

```bash
pnpm drizzle-kit studio
```

Open the studio URL in your browser, navigate to `menu_items` or `sauces`,
and edit the `file_name` cell directly.

### Via seed re-run (development only)

If you are working in a development environment, update the `fileName` field
in the relevant seed file (`server/db/seeds/ayceMenu.ts`, etc.) and re-run:

```bash
pnpm db:seed
```

---

## Adding an image to an item that currently has none

Some items (Alitas, Boneless, and wings packages) have `file_name = null`.
To add an image:

1. Upload the image to Blob following Option A or B above.
2. Update the DB row to set `file_name = 'menu/<folder>/<filename>.webp'`.

No code changes are required — the API automatically serves the URL once
`file_name` is non-null.

---

## Image format recommendations

- Use `.webp` for all images (best compression for web).
- Recommended dimensions: 800 x 600 px or larger for dish photos.
- Sauce images: 400 x 400 px square.
- Keep file sizes under 200 KB for fast loading.
