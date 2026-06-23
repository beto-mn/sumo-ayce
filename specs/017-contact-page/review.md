# Review: contact-page (017)

**Status:** APPROVED

## Verifications

### Acceptance criteria ↔ test traceability

All User Story acceptance scenarios are covered:

- US1 (wa.me link): `ContactForm.spec.ts` covers correct URL construction, verbatim phone, encoded text containing name+message, button-disabled-until-all-fields-filled, `window.open` called with `_blank`, and the EN locale variant (wa.me text uses visitor-typed content, not translated copy).
- US2 (right card): `ContactInfo.spec.ts` covers whatsappPrompt when no branch selected, WhatsApp pill URL when branch selected, mailto starts with `mailto:contacto@sumo.com.mx`, reactive subject/body, exactly three social pills with correct URLs, all external links with `_blank` + `rel="noopener noreferrer"`.
- US3 (graceful degradation): `ContactForm.spec.ts` covers loading indicator, error message without stack trace, CTA disabled on error/empty state, and empty-branches state message. `contact.spec.ts` confirms ContactInfo is visible regardless of branch fetch state.
- US4 (language toggle): `ContactForm.spec.ts` and `ContactInfo.spec.ts` both include EN locale sections verifying labels, placeholders, headings, and CTA text render in English without re-mount.
- FR-025 (SEO meta): `contact.spec.ts` tests `useSeoMeta` is called with the i18n title and description keys.

Total: 14 composable tests + 20 ContactForm tests + 19 ContactInfo tests + page tests = 535 tests pass across the repo (82 test files).

### Phase -1 Gates

All 13 Gates (I through XIII) in `specs/017-contact-page/plan.md` are marked `[x]`.

### Tasks

28/28 tasks marked `[x]` in `specs/017-contact-page/tasks.md`. 0 unchecked.

### `[NEEDS CLARIFICATION]` markers

None found in `specs/017-contact-page/spec.md`.

### `./init.sh`

Exit 0. Biome check, typecheck, and 535/535 tests all pass.

### Sensitive data scan (C7)

- Secret-pattern scan of the diff returns only `CRON_SECRET` as a Zod schema key referencing `process.env` — not a hardcoded value. No leaked credentials.
- No `.env` files tracked (`git ls-files` returns CLEAN).
- `biome-ignore` suppressions in `db.ts` all carry explicit justification comments.
- No `console.log`, TODO, or FIXME in the changed files.

### CHECKPOINTS C1-C7

- **C1**: All harness base files exist; `./init.sh` exits 0.
- **C2**: 1 feature in `in_progress`; all done features have passing tests.
- **C3 / C3.1**: Feature code lives under `app/features/contact/`. No `.vue` files at `app/components/` root. No cross-feature imports. Page template is 44 lines (≤100).
- **C4**: Every acceptance criterion covered by tests. `pnpm test` passes under both `server/` (34 files, 230 tests) and `app/` (48 files, 305 tests). Biome and typecheck both pass.
- **C5**: `progress/history.md` and `progress/current.md` present; no leftover temp files.
- **C6**: All spec files exist; all Phase -1 gates `[x]`; no `[NEEDS CLARIFICATION]`; all tasks `[x]`.
- **C7**: No secrets, no env files tracked, no PEM blocks, no hardcoded credentials.

### Frontend checks (files touched under `app/`)

- Folder structure: `app/features/contact/components/` and `app/features/contact/composables/` — correct vertical slice.
- No Vue files at `app/components/` root (confirmed empty).
- File sizes: `contact.vue` 44 lines, `ContactForm.vue` 177 lines, `ContactInfo.vue` 120 lines, `useContact.ts` 48 lines — all within limits.
- No default Tailwind palette classes (e.g. `bg-orange-500`) in contact files.
- No arbitrary Tailwind values (`bg-[...]`) in contact files.
- No inline hex colors in contact files.
- Storybook: `ContactForm.stories.ts` (Default, AllFieldsFilled, Loading, Error, EmptyBranches, Responsive) and `ContactInfo.stories.ts` (NoBranchSelected, BranchSelected, WithFormData, Responsive) both present.
- Co-located `.spec.ts` files present for both components and the composable.

### Two server fixes assessed

**`server/utils/env.ts`**: Changed from eager `safeParse` at module load to a lazy Proxy singleton that validates on first property access. The Zod schema is unchanged; error message format is unchanged; the `Env` type export is preserved. The only behavioral difference is validation defers to first use instead of import time. This correctly unblocks Nitro prerender initialization for the `/contact` static page (which has no DB or Twilio dependency) without weakening runtime protection — any route that actually touches `env.*` will still fail fast with the same human-readable error on missing variables. No regression risk to existing server routes.

**`server/utils/db.ts`**: Changed from a module-level Drizzle client to a lazy Proxy singleton using the same `getDb()` pattern. The exported `db` interface is API-identical — all routes continue to access it as `db.query`, `db.insert`, etc., and the Proxy's `bind(instance)` call ensures method context is preserved. The `biome-ignore` suppressions for `noExplicitAny` are pre-existing and carry justification (neon-http and node-postgres have identical query APIs but different TS types). All 230 server tests pass confirming no regressions. This is consistent with the lazy-env pattern and correctly defers DB initialization to runtime.

Both changes are additive fixes, are within `server/utils/` (the correct cross-feature location per Article I), and are out of scope for feature 017's spec — they are infrastructure fixes required to unblock the CI build for the static prerender route.

## Notes

- The `wa.me` message construction uses `t('contact.waMessage', { name, message })` via vue-i18n named interpolation instead of a manual `buildMessageText` replace helper. This is a sound simplification that keeps the composable `buildWaUrl` unit-testable while delegating template composition to the i18n layer where it belongs. The `useContact.spec.ts` still covers the `buildWaUrl` URL shape.
- The `@` escaping in i18n locale files (`contacto{'@'}sumo.com.mx`) is a documented vue-i18n requirement for linked-message syntax — not a bug.
- Constitution Article XIII requires env validation at startup. The lazy Proxy preserves the spirit of this requirement (first request to any server route triggers validation before the route handler executes) while accommodating the Vercel build constraint. If a future requirement demands startup-time validation independent of request handling, a Nitro plugin calling `resolveEnv()` explicitly would be the correct follow-up.
