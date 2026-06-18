<!--
  ⚠️ PR Title: must follow `<gitmoji> <type>(<scope>): <description>` —
     same convention as commit messages (see .husky/commit-msg).
     The repo is configured so the squash-merge subject = this title,
     so a valid title produces a valid commit automatically. A workflow
     (`.github/workflows/pr-title.yml`) blocks the PR if the title fails.

     Examples:
       ✨ feat(homepage): add hero section
       🐛 fix(api): handle missing phone in reservations
       🔖 release: v0.1.2
       🔧 chore(deps): bump pnpm to 10.27.0

  PR template. Delete the sections that don't apply. Keep the structure
  so reviewers can scan the PR in 30 seconds.
-->

## 📋 Summary

<!-- 1–3 bullets: WHAT this PR changes. No "why" here — keep that for Motivation if it's not obvious from the title. -->

-
-

## 🏷️ Type of change

<!-- Check one. If multiple apply, split into separate PRs. -->

- [ ] ✨ feat — new feature
- [ ] 🐛 fix — bug fix
- [ ] ♻️ refactor — code change that neither fixes a bug nor adds a feature
- [ ] 📝 docs — documentation only
- [ ] ✅ test — adding or correcting tests
- [ ] 🔧 chore — tooling, config, deps, CI
- [ ] ⚡ perf — performance improvement
- [ ] 👷 ci — CI/CD changes only

## 🔗 Related artifacts

<!-- Link to the SDD artifacts that drove this PR. Skip lines that don't apply. -->

- 📌 **Feature**: `feature_list.json` id=`<n>` — `<name>`
- 📄 **Spec**: `specs/<num>-<name>/`
- 🔒 **Closes**: #
- 🔖 **Refs**: #

## 💡 Motivation

<!-- Optional. Use this when the "why" is not obvious from the title. Quote the constitution article, the user request, or the bug ticket. -->

## 🧪 Test plan

<!-- Concrete steps the reviewer (human or agent) can run. Check off what's verified locally. -->

- [ ] 🟢 `./init.sh` exits 0
- [ ] 🧪 `pnpm test` — all green (server + app projects)
- [ ] 📚 `pnpm storybook` — every UI story renders without console errors (if UI changes)
- [ ] 👀 Manual verification: <describe what you clicked / where you looked>

## 📸 Preview / screenshots

<!-- For UI changes, paste before/after screenshots or the Vercel preview URL the CI surfaced. Delete if no visual change. -->

## 🛡️ Constitution gates

<!-- Quick sanity check against the recurring rules. Tick what passes. Anything left empty is a blocker. -->

- [ ] 🎨 No hardcoded colors in `app/` — T108a/b/c grep returns zero
- [ ] 🗣️ No "buffet" / "comida japonesa" in user-facing copy (`grep -rni "buffet\|comida japonesa" app/ i18n/`)
- [ ] 🧩 Every new `app/components/**/*.vue` has a co-located `.spec.ts` AND `.stories.ts`
- [ ] 🗺️ No `mapbox-gl` import outside `app/composables/maps/adapters/`
- [ ] 🔐 No secrets in source (`VERCEL_TOKEN`, JWT shapes, API keys, `.env` files committed)
- [ ] 🪝 Pre-commit hooks pass without `--no-verify`

## 👤 Human-only follow-ups

<!-- Actions the implementer cannot perform (require repo admin / external dashboards). The repo owner must complete these after merge. Delete if none. -->

- [ ]

## ⚠️ Deviations

<!-- Any deviation from the spec / plan the reviewer should know about. Be specific. Delete if none. -->
