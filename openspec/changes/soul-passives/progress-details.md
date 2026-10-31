# Progress — `soul-passive-daily-rewards`

## Scope and implementation

- Implemented Giant Bat's daily +5/+10/+15% XP and Slogra's +5/+10/+15 coin
  reward at the fifth unique valid completion.
- Rewards use the locked daily loadout, with same-date/current-expedition
  `DaySnapshot` state authoritative during correction. Side quests do not count
  as outstanding obligations for Giant Bat.
- Reconciled the persisted reward annotations and `SoulPassiveActivation`
  ledger during supported date corrections, so removed or newly valid
  completions do not leave stale or duplicate rewards.
- Reversal accounting preserves base rewards separately from passive bonuses,
  checks the final coin balance, and rewinds XP/level/max-HP state when a Bat
  bonus is revoked.

## Files changed for this task

- `src/lib/dailySoulRewards.ts` — daily reward calculation and stable bonus
  annotations.
- `src/lib/dayCorrections.ts` — correction-time recomputation, ledger updates,
  and base-versus-bonus accounting.
- `tests/soulPassives.test.mjs` — rank, threshold, obligation/side-quest,
  loadout, date-scope, unique-completion, and idempotence coverage.
- `tests/dayCorrections.test.mjs` — level-rewind, spent-coins, and integrated
  undo-accounting regressions.
- `openspec/changes/soul-passives/review.md` — integrity review record.

Existing user changes to `Todo.md`, OpenSpec task/proposal files,
`scripts/test.mjs`, `src/types/index.ts`, `src/db/database.ts`,
`src/lib/backup.ts`, and `src/lib/souls.ts` were left untouched.

## Validation

- Working directory: `C:\Users\jujsaez\Desktop\Sopra\Apps\Hábitos`
- Toolchain: npm scripts; installed Node/npm and repository `node_modules`;
  no environment overrides.
- `npm test` — exit 0; 136 tests passed, 0 failed. Includes the existing test
  suites and the daily passive/correction regressions.
- `npm run build` — exit 0; TypeScript compilation and Vite production build
  passed. Vite emitted its existing chunk-size advisory (>500 kB); no TypeScript
  errors.
- `npx eslint src/lib/dailySoulRewards.ts src/lib/dayCorrections.ts
  tests/soulPassives.test.mjs tests/dayCorrections.test.mjs` — exit 0.
- Final `npm run lint` — exit 1 only for an existing violation in untouched
  `src/components/NumberField.tsx:27` (`react-hooks/set-state-in-effect`). The
  targeted lint for every file changed in this task passes.
- `git diff --check` — exit 0.
- Whole-solution build: not applicable; this repository uses the root Vite
  application build above.

## Workflow context and review

- No active Upgrade scenario was available from workflow state, and no
  scenario-skill root, `scenario-instructions.md`, registered `task.md`, or
  task-specific progress path was forwarded. The task scope is one bounded
  daily-reward/correction behavior; no decomposition stage/hint files were
  available to evaluate.
- The task was **not** marked done and no lifecycle completion action was
  called.
- Integrity review: **PASS**; findings IR-001 through IR-005 resolved.
  Record: `openspec/changes/soul-passives/review.md`.
