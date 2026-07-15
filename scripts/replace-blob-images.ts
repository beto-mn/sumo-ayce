/**
 * One-off ops script: replace menu images in Vercel Blob with new local webp
 * files, KEEPING the exact existing pathname (= DB `file_name`) so the URLs and
 * the DB stay unchanged.
 *
 * Local source folder (client's wetransfer export). Each local file maps to a
 * dish by name; a dish may live in several locations (ayce/express/ala-carta/
 * kids), each with its OWN blob path — the file is uploaded to ALL of them.
 *
 * Usage:
 *   pnpm tsx --env-file-if-exists=.env scripts/replace-blob-images.ts          # dry run
 *   pnpm tsx --env-file-if-exists=.env scripts/replace-blob-images.ts --apply  # upload
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { put } from '@vercel/blob'
import { menuItems } from '../server/db/schema'
import { db } from '../server/utils/db'

const SRC = '/Users/betonajera/Downloads/wetransfer_fotos-web_2026-07-13_1959'
const APPLY = process.argv.includes('--apply')

/**
 * Local files whose name differs from the DB nameEs → map to the exact nameEs.
 * Keyed by the NORMALISED base name (norm()) so macOS NFD-decomposed accents in
 * the filenames still match.
 */
const OVERRIDE: Record<string, string> = {
  'JAPAN SANDWICH CAMARON': 'Sumo Sándwich de Camarón',
  'JAPAN SANDWICH SALMON': 'Sumo Sándwich de Salmón',
  'JAPAN SANDWICH SURIMI': 'Sumo Sándwich de Surimi',
  SANGRIA: 'Sangría Sumo',
}
/** Local files that are NOT menu images (skip). */
const SKIP = new Set(['garantia-sumo.webp'])

const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/\.WEBP$/, '')
    .replace(/_B$/, '')
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()

async function main() {
  const local = readdirSync(SRC).filter(f => f.toLowerCase().endsWith('.webp'))
  const rows = await db
    .select({ name: menuItems.nameEs, file: menuItems.fileName })
    .from(menuItems)

  const byName = new Map<string, string[]>()
  const byNorm = new Map<string, string[]>()
  for (const r of rows) {
    if (!r.file) continue
    byName.set(r.name, [...(byName.get(r.name) ?? []), r.file])
    const k = norm(r.name)
    byNorm.set(k, [...(byNorm.get(k) ?? []), r.file])
  }

  const plan: { file: string; paths: string[] }[] = []
  const skipped: string[] = []
  const unmatched: string[] = []
  for (const f of local.sort()) {
    if (SKIP.has(f)) {
      skipped.push(f)
      continue
    }
    const override = OVERRIDE[norm(f)]
    const paths = override ? byName.get(override) : byNorm.get(norm(f))
    if (paths?.length) plan.push({ file: f, paths })
    else unmatched.push(f)
  }

  console.log(`\nMode: ${APPLY ? 'APPLY (uploading)' : 'DRY RUN'}`)
  console.log(
    `Local webp: ${local.length} | mapped: ${plan.length} | skipped: ${skipped.length} | UNMATCHED: ${unmatched.length}`
  )
  console.log(`Skipped (not menu images): ${skipped.join(', ') || 'none'}`)
  if (unmatched.length) {
    console.error(
      `\n❌ UNMATCHED (aborting${APPLY ? '' : ' would abort'}): ${unmatched.join(', ')}`
    )
    if (APPLY) process.exit(1)
  }

  let uploads = 0
  for (const { file, paths } of plan) {
    const buf = readFileSync(join(SRC, file))
    for (const path of paths) {
      if (!APPLY) {
        console.log(`  [dry] ${file} → ${path}`)
        uploads++
        continue
      }
      const res = await put(path, buf, {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'image/webp',
      })
      const rel = res.url.split('.blob.vercel-storage.com/')[1] ?? res.url
      const ok = rel === path
      console.log(`  ${ok ? '✓' : '⚠ URL≠path'} ${file} → ${path}`)
      uploads++
    }
  }
  console.log(
    `\n${APPLY ? 'Uploaded' : 'Would upload'} ${uploads} blob objects across ${plan.length} images.`
  )
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.error('ERR', e)
    process.exit(1)
  })
