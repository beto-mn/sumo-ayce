# Review: reservation-page (014)

**Status:** APPROVED

## Verifications

### Acceptance Criteria Coverage

All acceptance criteria from `spec.md` are covered by at least one concrete test:

| Story | AC | Test location |
|-------|----|---------------|
| US1 | AC1 – branch pre-selected from `?branch` | `ReservationForm.spec.ts` pre-fill block |
| US1 | AC2 – `?type=ayce` → AYCE + orange accent | `ReservationForm.spec.ts` |
| US1 | AC3 – `?type=express` → Express + blue accent | `ReservationForm.spec.ts` |
| US1 | AC4 – no params → unselected, defaults AYCE | `ReservationForm.spec.ts` |
| US1 | AC5 – unknown `?branch` → no crash, unselected | `ReservationForm.spec.ts` |
| US2 | AC1 – loading state on submit | `ReservationForm.spec.ts` submit block |
| US2 | AC2 – 201 → confirmation with folio | `ReservationForm.spec.ts` |
| US2 | AC3 – confirmation fields: folio, branch, date, time, partySize, WhatsApp note | `ReservationConfirmation.spec.ts` |
| US2 | AC4 – "Hacer otra reservación" resets to form | `ReservationForm.spec.ts` |
| US3 | AC1 – 4xx/5xx → button restored, error banner | `ReservationForm.spec.ts` error block |
| US3 | AC2 – 422 → generic user-facing message | `useReservationSubmit.test.ts` |
| US3 | AC3 – network failure → same error UX | `ReservationForm.spec.ts` |
| US3 | AC4 – field edit → banner cleared | `ReservationForm.spec.ts` |
| US4 | AC1-8 – per-field validation messages | `ReservationForm.spec.ts` + `useReservationSubmit.test.ts` |
| US4 | AC9 – all valid → API called once | `useReservationSubmit.test.ts` |
| US5 | AC1 – future date: min/max on time input | `ReservationFieldsDateTime.spec.ts` + `ReservationForm.spec.ts` |
| US5 | AC2 – today: past slots excluded | `useReservationSlots.test.ts` today filtering block |
| US5 | AC3 – no branch → hint "Selecciona una sucursal primero" | `ReservationFieldsDateTime.spec.ts` `hint-no-branch` |
| US5 | AC4 – no schedule → "Horarios no disponibles" | `ReservationFieldsDateTime.spec.ts` `hint-no-schedule` |
| US5 | AC5 – branch change → time cleared | `ReservationForm.spec.ts` |

**Result: 20/20 acceptance criteria covered.**

### Phase -1 Gates

All 9 gates marked `[x]` and verified in code:

- Gate 1: `'/reserve': { ssr: true }` present in `nuxt.config.ts` line 88.
- Gate 2: `grep -r 'drizzle-orm|@neondatabase' app/` returns empty.
- Gate 3: All feature code under `app/features/reservation/` and `app/pages/reserve.vue`.
- Gate 4: `reserve.vue` template is 76 lines (well under 100).
- Gate 5: `ReservationForm.stories.ts` and `ReservationConfirmation.stories.ts` exist with Default + variants + Loading + Error + Mobile + Desktop stories.
- Gate 6: `./init.sh` exits 0 (biome + typecheck pass).
- Gate 7: Composable coverage 96.2% statements / 80.7% branches — above 70% threshold.
- Gate 8: 35 `reservation.*` keys present in both `i18n/locales/es.json` and `i18n/locales/en.json`; keys match exactly between locales.
- Gate 9: `docs/business/rendering-strategy.md` §4 table includes `/reserve → ssr:true` row (feature 014).

### Tasks Completed

All 39 tasks in `tasks.md` are marked `[x]`.

### `./init.sh`

Exit code 0. 90 test files, 667 tests passing.

### CHECKPOINTS C1–C7

- **C1**: All harness base files exist; `./init.sh` exits 0.
- **C2**: 1 feature in `in_progress` (feature 14 — reservation-page). All done features have passing tests.
- **C3 / C3.1**: Feature code lives under `app/features/reservation/`; `find app/components -maxdepth 1 -name '*.vue'` returns empty; no cross-feature imports; `reserve.vue` is thin (76 lines); no DB client under `app/`.
- **C4**: Every acceptance criterion covered; tests use real fixtures with synthetic data; `pnpm test` passes 667 tests across app/ and server/; Biome passes; typecheck passes.
- **C5**: `progress/history.md` has entries for all closed sessions; no leftover temp files.
- **C6**: `specs/014-reservation-page/` folder complete with spec.md, plan.md, tasks.md; all Phase -1 gates `[x]`; no `[NEEDS CLARIFICATION]` markers; all tasks `[x]`.
- **C7**: No hardcoded secrets, tokens, or credentials in diff; no `.env` files tracked; test fixtures use synthetic data (`+5215555555555`, `test@example.com`-style values, `SUMO-1234` folios); `.env.example` is the only env file committed.

### Frontend Checks (Article I / VII)

- No `.vue` files at `app/components/` root.
- All new components are under `app/features/reservation/components/`.
- No cross-feature imports.
- `reserve.vue` template: 76 lines (≤ 100).
- Component files: max 184 lines for `ReservationForm.vue` (≤ 200).
- Every new `.vue` has a co-located `.spec.ts` and `.stories.ts`.
- Stories include Default + significant variants + Mobile + Desktop viewport stories for all 5 new components.
- No default Tailwind palette classes (`bg-orange-500`, etc.) found.
- No arbitrary Tailwind values (`bg-[#...]`) found.
- No inline hex colors in components/layouts/pages.
- `--accent` swap via `:style` binding on wrapper element per FR-021.
- Express blue (`var(--blue)`) scoped to Express type context only; AYCE uses `var(--orange)`.
- No new CSS tokens added without mirroring in `tailwind.config.ts`.
- `aria-describedby` links error messages to fields; `aria-busy` on submit button during submission.
- `@media (prefers-reduced-motion: reduce)` rule present in `ReservationForm.vue`.

## Notes (non-blocking)

- `feature_list.json` entry for feature 14 has `"title": "Reservation Page (/reservar)"` — the `/reservar` in the title field is a stale string from the original feature entry. The route is correctly `/reserve` everywhere in the implementation, spec, plan, tasks, and nuxt.config.ts. This metadata field has no runtime impact.
- `progress/current.md` was not updated to reflect the 014 session; it still describes the 012 close. This is a session-management note, not a blocking issue, and is outside the scope of what the reviewer modifies.
- Coverage on `useReservationSubmit.ts` shows 66.7% branch coverage. The overall composable coverage (96.2% statements, 80.7% branches) remains well above the 70% threshold. The uncovered branches in `useReservationSubmit.ts` (lines 85–114) are the `confirmationData` assembly path — covered by the happy-path test but some conditional branches within are not hit. This does not breach the 70% composable threshold.
