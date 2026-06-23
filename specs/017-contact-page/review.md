# Review: contact-page (017)

**Status:** APPROVED

## Verifications

### Previously-blocking items (R1, R2, R3)

- **R1 — Biome format**: `pnpm check --error-on-warnings` exits 0. `./init.sh` step 4 reports "Biome check OK". RESOLVED.
- **R2 — tasks.md**: 28 tasks marked `[x]`, 0 unchecked. RESOLVED.
- **R3 — impl file**: `progress/impl_017-contact-page.md` exists with complete decision log. RESOLVED.

### Acceptance criteria covered by tests: 13/13

| Criterion | Test file | Test name |
|---|---|---|
| AS1.1 — wa.me opens on valid submit | ContactForm.spec.ts | "calls window.open with correct wa.me URL on valid submit" |
| AS1.2 — button disabled until all fields filled | ContactForm.spec.ts | "CTA button is disabled when all fields are empty" / "enabled when all three fields filled" |
| AS1.3 — text param contains name + message | ContactForm.spec.ts | "wa.me text contains name and message but not branch phone" |
| AS1.4 — phone used verbatim | ContactForm.spec.ts | "wa.me URL host uses branch phone 5215512345678 verbatim" |
| AS2.1 — no branch → prompt | ContactInfo.spec.ts | "shows whatsappPrompt when selectedBranch is null" |
| AS2.2 — branch selected → pill | ContactInfo.spec.ts | "WhatsApp pill links to correct wa.me URL" |
| AS2.3 — mailto reactive | ContactInfo.spec.ts | "email link subject includes branch name", "body includes name/message" |
| AS2.4 — Instagram URL | ContactInfo.spec.ts | "Instagram pill links to correct URL" |
| AS3.1 — error state, no stack trace | ContactForm.spec.ts | "shows error message", "error message contains no stack trace" |
| AS3.2 — loading state | ContactForm.spec.ts | "shows loading indicator when branches are loading" |
| AS3.3 — empty state | ContactForm.spec.ts | "shows empty state when no branches have a phone" |
| AS4.1/4.2 — EN locale | ContactForm.spec.ts + ContactInfo.spec.ts | "renders English labels when locale is EN", "renders prompt text from i18n key (EN locale sim)" |
| AS4.3 — wa.me language-agnostic | ContactForm.spec.ts | "EN wa.me text uses visitor typed content not translated copy" |

### Phase -1 Gates marked: 13/13

All gates G-I.1 through G-XIII.1 marked `[x]` in `plan.md`.

### Tasks completed: 28/28

All tasks T001–T027 (including T013b) marked `[x]` in `tasks.md`.

### ./init.sh: exit 0

- Step 4 (Biome check): OK
- Step 5 (typecheck): OK
- Step 6 (tests): 82 test files, 535 tests — all passed

### CHECKPOINTS C1–C7: all OK

- **C1**: All harness base files present; `./init.sh` exits 0.
- **C2**: Feature is `in_progress` (not yet marked done); state is coherent.
- **C3/C3.1**: Feature code lives under `app/features/contact/`; no `.vue` at `app/components/` root; no cross-feature imports; page template 44 lines (≤ 100).
- **C4**: 56 contact tests pass (`pnpm test app/features/contact/ app/pages/contact.spec.ts`); all acceptance criteria covered; `pnpm check` and `pnpm typecheck` pass.
- **C5**: `progress/impl_017-contact-page.md` exists.
- **C6**: `spec.md` has no `[NEEDS CLARIFICATION]`; all Phase -1 gates `[x]`; all tasks `[x]`; every acceptance criterion covered.
- **C7**: No secrets in diff; no tracked `.env` files; no hardcoded credentials; synthetic test values only.

### Security scan: clean

- Secret-pattern grep on uncommitted diff: 0 matches.
- `git ls-files | grep -E '^\.env'`: 0 matches.

### Design token enforcement: clean

- Default Tailwind palette classes: 0 matches.
- Arbitrary values `(...)=[...]`: 0 matches.
- Inline hex in components/layouts/pages: 0 matches.

### Structural checks

- `app/features/contact/` contains `components/`, `composables/`, `types.ts` only — no spreading.
- `ContactForm.vue`: 177 lines (≤ 200 ✓).
- `ContactInfo.vue`: 120 lines (≤ 200 ✓).
- `contact.vue` template: 44 lines (≤ 100 ✓).
- Co-located specs: `ContactForm.spec.ts`, `ContactInfo.spec.ts`, `useContact.spec.ts`, `contact.spec.ts` — all present.
- Co-located stories: `ContactForm.stories.ts` (Default, Loading, Error, EmptyBranches, AllFieldsFilled, Mobile, Desktop), `ContactInfo.stories.ts` (NoBranchSelected, BranchSelected, WithFormData, Mobile, Desktop) — all present with variant and responsive coverage.
- `nuxt.config.ts`: `'/contact': { prerender: true }` present.
- `docs/business/rendering-strategy.md`: `/contact` row in §2 and §4 tables.
- i18n: all `contact.*` keys in `es.json` and `en.json` with `{'@'}` escaping for email and TikTok URL.

## Notes

- The `wa.me` message template uses `t('contact.waMessage', { name, message })` via vue-i18n named interpolation rather than a manual `.replace()` helper. This is a valid and simpler approach; the `buildMessageText` function in `useContact.ts` is exercised by the composable tests and serves as a fallback path.
- `filterAndSortBranches` uses `b.phone !== null` to filter contact-eligible branches. The implementation note in `impl_017-contact-page.md` correctly documents that `whatsappReservaciones` is a separate field used for reservation routing — the contact form correctly uses the general `phone` field from `BranchPublicRow`.
- File sizes are within limits; no decomposition needed.
