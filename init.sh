#!/usr/bin/env bash
# init.sh — Environment verification and initialization
# Run at session START and before declaring any task done.

set -u

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

ok()   { printf "${GREEN}[OK]${NC}    %s\n" "$1"; }
warn() { printf "${YELLOW}[WARN]${NC}  %s\n" "$1"; }
fail() { printf "${RED}[FAIL]${NC}  %s\n" "$1"; }

EXIT_CODE=0

echo "── 1. Verifying environment ────────────────────────────"

if command -v node >/dev/null 2>&1; then
  NODE_MAJOR=$(node --version | sed 's/v//' | cut -d. -f1)
  if [ "$NODE_MAJOR" -ge 22 ]; then
    ok "Node.js $(node --version)"
  else
    fail "Node.js $(node --version) — requires >= 22"
    EXIT_CODE=1
  fi
else
  fail "Node.js not found"
  EXIT_CODE=1
fi

if command -v pnpm >/dev/null 2>&1; then
  PNPM_MAJOR=$(pnpm --version | cut -d. -f1)
  if [ "$PNPM_MAJOR" -ge 10 ]; then
    ok "pnpm $(pnpm --version)"
  else
    fail "pnpm $(pnpm --version) — requires >= 10"
    EXIT_CODE=1
  fi
else
  fail "pnpm not found"
  EXIT_CODE=1
fi

echo ""
echo "── 2. Verifying harness base files ─────────────────────"

for f in AGENTS.md feature_list.json progress/current.md \
         docs/harness/architecture.md docs/harness/conventions.md \
         docs/harness/verification.md docs/harness/specs.md \
         CHECKPOINTS.md; do
  if [ -f "$f" ]; then
    ok "Exists $f"
  else
    fail "Missing $f"
    EXIT_CODE=1
  fi
done

# Validate that docs/business/ exists with at least 1 file
if [ -d docs/business ] && [ -n "$(ls -A docs/business 2>/dev/null)" ]; then
  ok "docs/business/ has project context"
else
  fail "docs/business/ empty or missing — add at least overview.md"
  EXIT_CODE=1
fi

echo ""
echo "── 3. Validating feature_list.json and specs ───────────"

if [ -f feature_list.json ]; then
  if node -e "JSON.parse(require('fs').readFileSync('feature_list.json','utf8'))" 2>/dev/null; then
    ok "feature_list.json is valid JSON"
  else
    fail "feature_list.json is not valid JSON"
    EXIT_CODE=1
  fi

  IN_PROGRESS_COUNT=$(node -e "
    const fl = JSON.parse(require('fs').readFileSync('feature_list.json','utf8'));
    console.log(fl.features.filter(f => f.status === 'in_progress').length);
  " 2>/dev/null || echo "0")

  if [ "$IN_PROGRESS_COUNT" -le 1 ]; then
    ok "Features in_progress: $IN_PROGRESS_COUNT (max 1)"
  else
    fail "There are $IN_PROGRESS_COUNT features in_progress — only 1 is allowed"
    EXIT_CODE=1
  fi

  MISSING_SPECS=$(node -e "
    const fl = JSON.parse(require('fs').readFileSync('feature_list.json','utf8'));
    const fs = require('fs');
    const missing = fl.features
      .filter(f => f.sdd === true && f.status !== 'pending')
      .filter(f => {
        const path = f.spec_path || ('specs/' + String(f.id).padStart(3,'0') + '-' + f.name);
        return !['spec.md','plan.md','tasks.md'].every(file => fs.existsSync(path + '/' + file));
      })
      .map(f => f.name);
    console.log(missing.join(','));
  " 2>/dev/null || echo "")

  if [ -z "$MISSING_SPECS" ]; then
    ok "All sdd:true (non-pending) features have their 3 spec files"
  else
    fail "Features with incomplete specs: $MISSING_SPECS"
    EXIT_CODE=1
  fi
fi

echo ""
echo "── 4. Running lint (biome) ─────────────────────────────"
pnpm check 2>&1 | tail -5
if [ "${PIPESTATUS[0]}" -eq 0 ]; then
  ok "Biome check OK"
else
  fail "Biome check failed"
  EXIT_CODE=1
fi

echo ""
echo "── 5. Running typecheck ────────────────────────────────"
pnpm typecheck 2>&1 | tail -5
if [ "${PIPESTATUS[0]}" -eq 0 ]; then
  ok "Typecheck OK"
else
  fail "Typecheck failed"
  EXIT_CODE=1
fi

echo ""
echo "── 6. Running tests ────────────────────────────────────"
pnpm test 2>&1 | tail -10
if [ "${PIPESTATUS[0]}" -eq 0 ]; then
  ok "Tests OK"
else
  fail "Tests failed"
  EXIT_CODE=1
fi

echo ""
echo "── 6.5 Building Storybook ──────────────────────────────"
pnpm storybook:build 2>&1 | tail -5
if [ "${PIPESTATUS[0]}" -eq 0 ]; then
  ok "Storybook build OK"
else
  fail "Storybook build failed"
  EXIT_CODE=1
fi

echo ""
echo "── 7. Summary ──────────────────────────────────────────"
if [ $EXIT_CODE -eq 0 ]; then
  ok "Environment ready. You can start working."
else
  fail "Environment is NOT ready. Fix the errors before proceeding."
fi

exit $EXIT_CODE
