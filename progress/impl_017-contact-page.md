# Implementation: 017 — contact-page

**Branch**: feat/017-contact-page
**Status**: Complete — all tasks verified, tests passing, build clean

## Completed tasks

All tasks in `specs/017-contact-page/tasks.md` executed in order:

- [x] T001: Created feature slice folders `app/features/contact/components/` and `app/features/contact/composables/`
- [x] T002: Added `routeRules['/contact'] = { prerender: true }` to `nuxt.config.ts`
- [x] T003: Updated `docs/business/rendering-strategy.md` — added `/contact` row (prerender, static shell)
- [x] T004: `app/features/contact/types.ts` — `ContactBranch`, `ContactFormState`, `WaLinkConfig`
- [x] T005: Added all `contact.*` i18n keys to `i18n/locales/es.json` (including `{'@'}` escape for email and TikTok URL)
- [x] T006: Added all `contact.*` i18n keys to `i18n/locales/en.json` (same escaping)
- [x] T007: Wrote failing `app/features/contact/composables/useContact.spec.ts` (14 tests)
- [x] T008: Implemented `app/features/contact/composables/useContact.ts`
- [x] T009: All 14 composable tests green
- [x] T010: Wrote failing `app/features/contact/components/ContactForm.spec.ts` (20 tests)
- [x] T011: Implemented `app/features/contact/components/ContactForm.vue` — 3 fields (name, branch, message), no phone field; `useFetch` with `server: false`; wa.me via `t('contact.waMessage', { name, message })`
- [x] T012: All 20 ContactForm tests green
- [x] T013: `app/features/contact/components/ContactForm.stories.ts` — Default, AllFieldsFilled, Loading, Error, EmptyBranches, Responsive stories
- [x] T013b: `app/pages/contact.vue` — `selectedBranch` ref lifted to page, passed as prop to ContactInfo
- [x] T014: Wrote failing `app/features/contact/components/ContactInfo.spec.ts` (19 tests)
- [x] T015: Implemented `app/features/contact/components/ContactInfo.vue` — dynamic branch WhatsApp, reactive mailto, 3 social pills
- [x] T016: All 19 ContactInfo tests green
- [x] T017: `app/features/contact/components/ContactInfo.stories.ts` — NoBranchSelected, BranchSelected, WithFormData, Responsive stories
- [x] T018: Wrote failing `app/pages/contact.spec.ts`
- [x] T019: Implemented `app/pages/contact.vue` — two-column layout, SEO meta, ContactForm + ContactInfo wired
- [x] T020: Page tests green
- [x] T021: i18n EN tests added to ContactForm.spec.ts
- [x] T022: i18n EN tests added to ContactInfo.spec.ts
- [x] T023: All contact feature tests green (`pnpm test app/features/contact/`)
- [x] T024: Reduced-motion pass — loading spinner uses `motion-reduce:animate-none`
- [x] T025: Accessibility pass — all fields labeled, `aria-required`, 44px touch targets, social pills with `aria-label`
- [x] T026: No inline hex — `grep` returns zero matches across `app/features/contact/` and `app/pages/contact.vue`
- [x] T027: `pnpm check && pnpm typecheck && pnpm test && pnpm build` — all green

## Notable decisions

- **wa.me message**: Used `t('contact.waMessage', { name, message })` directly instead of a manual `.replace()` helper, because vue-i18n treats `{name}`/`{message}` in message values as named interpolation placeholders — calling `t()` without values produced empty substitutions.
- **i18n `@` escaping**: Email (`contacto@sumo.com.mx`) and TikTok URL (`https://www.tiktok.com/@sumooficial`) stored as `contacto{'@'}sumo.com.mx` and `https://www.tiktok.com/{'@'}sumooficial` — vue-i18n linked message syntax would otherwise fail to parse the entire locale file.
- **`server: false`** on `useFetch('/api/v1/branches')`: page is SSG (`prerender: true`); the branch list must be fetched client-side so it reflects live data, not a stale prerender snapshot.
- **`filterAndSortBranches`** uses `b.phone !== null` — filters to branches that have a general phone; `whatsappReservaciones` (added to seed) is a separate field used for reservation-specific WA routing, not the contact form.
