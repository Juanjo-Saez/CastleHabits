# Integrity review: soul-passive-daily-rewards

## Round 1 — 2026-10-31

**Verdict: CHANGES NEEDED**

### IR-001 — Blocking — Open

**Location:** `src/lib/dailySoulRewards.ts:94`

`reconcileDailySoulRewards` calls `stripDailyBonus` for every completion in the
database, not just completions for the date being reconciled. Saving a correction
for today therefore removes the persisted Giant Bat/Slogra bonus fields and reward
amounts from yesterday (and any other date), while the profile delta only accounts
for the corrected date. This corrupts historical completion accounting and makes a
later correction unable to know what reward was previously paid.

**Required fix:** Strip and recompute bonuses only on completions whose `date`
matches the requested reconciliation date; preserve every completion from other
dates byte-for-byte. Add a regression case with rewarded completions on at least
two dates and reconcile only one date.

### IR-002 — Blocking — Open

**Location:** `src/lib/dayCorrections.ts:603`

The post-reconciliation Slogra delta is assigned directly to
`nextProfile.coins` without the non-negative balance check used earlier by
`planDayCorrection`. If exactly five unique completions exist and the player has
spent the Slogra reward, undoing an earlier (non-reward-bearing) completion passes
the earlier base-coin check and then subtracts the separate daily bonus here,
allowing a negative coin balance.

**Required fix:** Validate the final profile coin balance after the daily reward
delta and reject the correction with the existing “gold already spent” behavior
before any writes. Cover removal of a non-fifth completion from an exactly-five
day after the bonus coins have been spent.

### IR-003 — Blocking — Open

**Location:** `src/lib/dayCorrections.ts:575-580`; `src/lib/dailySoulRewards.ts:123-125`

Reward reconciliation passes a snapshot based only on its date. The activation
lookup accepts that snapshot without checking that `snapshot.runStartedAt` equals
the current profile expedition. A stale snapshot under the same date can therefore
override the current day's locked loadout and grant or suppress a reward using a
different expedition's equipment. This conflicts with the `DaySnapshot` contract
that cross-expedition snapshots are not used.

**Required fix:** Treat a snapshot as eligible only when both its date and
`runStartedAt` match the reward date and current run; otherwise use the matching
current daily loadout or no soul. Add mismatched-run coverage.

### IR-004 — Blocking — Open

**Location:** `src/lib/dayCorrections.ts:601-602`

Removing a Giant Bat reward only clamps XP inside the current level. When the
bonus contributed to a level-up and current-level XP is smaller than the removed
bonus, part of the reward remains represented by the retained level (and retained
max HP). The corresponding negative snapshot path has the same behavior, so the
correction does not fully remove stale XP.

**Required fix:** Apply the negative reward delta with the existing `rewindXp`
semantics and reconcile level, max HP, HP, snapshot, and level-up state
consistently. Add a correction regression where the Bat bonus crossed a level
boundary and is later revoked.

### Test assessment

`tests/soulPassives.test.mjs` verifies the pure reward helper's rank, fifth-unique,
loadout, and same-date idempotency behavior, but it does not exercise
`saveDayCorrection` persistence/profile accounting. Consequently it does not
detect IR-001 through IR-004.

**Resolved findings:** none.

## Round 2 — 2026-10-31

**Verdict: CHANGES NEEDED**

### IR-001 — Blocking — Resolved

**Location:** `src/lib/dailySoulRewards.ts:94-96`;
`tests/soulPassives.test.mjs:254-271`

Reward stripping is now restricted to completions whose `date` equals the
reconciled date, and the regression test verifies that a rewarded completion
from another date is returned unchanged.

### IR-002 — Blocking — Resolved

**Location:** `src/lib/dayCorrections.ts:404-440`;
`tests/dayCorrections.test.mjs:119-147`

The pure reconciliation step now applies the net passive coin adjustment and
rejects a negative final balance with the existing spent-gold error. The test
covers removing the former fifth-completion reward after its coins were spent.

### IR-003 — Blocking — Resolved

**Location:** `src/lib/dailySoulRewards.ts:59-72`;
`tests/soulPassives.test.mjs:225-252`

Daily activation resolution now accepts a same-date snapshot only when its
`runStartedAt` matches the current profile expedition. Coverage verifies both a
matching snapshot loadout and rejection of a snapshot from another expedition.

### IR-004 — Blocking — Open

**Location:** `src/lib/dayCorrections.ts:530-564`, `src/lib/dayCorrections.ts:624`,
`src/lib/dayCorrections.ts:648-655`; `tests/dayCorrections.test.mjs:79-117`

The new `rewindXp` path only processes the separate `xpDelta` computed from
bonuses still present in `initialPlan.completions`. If the completion carrying
the Giant Bat bonus itself is undone, `planDayCorrection` removes that
completion and subtracts its full `xpEarned` through the existing clamping path
(`Math.max(0, ...)`), so `dailySoulBonusTotals(plan.completions, date)` sees no
retained bonus and the subsequent passive `xpDelta` is zero. The profile
therefore keeps the level and max HP produced by the removed bonus; the snapshot
has the same issue because its initial negative delta goes through
`reconcileSnapshot`. The added test invokes `reconcileDailySoulCorrection`
directly with the rewarded completion still in the plan, so it does not cover
this integrated removal path.

**Required fix:** Ensure a bonus attached to a completion being removed is
separated from the base correction and passed through the `rewindXp` profile and
snapshot logic (without double-subtracting it). Add an orchestration-level
regression representing undo of the bonus-bearing completion across a level
boundary.

**Resolved findings:** IR-001, IR-002, IR-003.

## Round 3 — 2026-10-31

**Verdict: CHANGES NEEDED**

### IR-004 — Blocking — Resolved

**Location:** `src/lib/dayCorrections.ts:405-441`,
`src/lib/dayCorrections.ts:522-534`, `src/lib/dayCorrections.ts:565`,
`src/lib/dayCorrections.ts:624-625`;
`tests/dayCorrections.test.mjs:120-161`

The base correction now excludes the persisted daily Bat bonus from the
completion XP it removes. The subsequent reconciliation compares the new reward
against bonuses in the pre-correction completions and applies a negative delta
through `rewindXp` for both profile and snapshot, including level, max-HP, and
HP caps. The integrated regression removes the bonus-bearing completion itself
and verifies the level 2 / 5 XP / 15 max-HP state rewinds to level 1 / 65 XP /
10 max HP in both profile and snapshot.

### IR-005 — Blocking — Open

**Location:** `src/lib/dayCorrections.ts:531-536`

The equivalent base/reward separation was not applied to coins.
`existingBaseCoins` is calculated, but `coinDelta` still subtracts the full
`existing.coinsEarned`, including `dailySoulBonusCoins`. Reconciliation then
subtracts that same previous daily bonus again via `coinsDelta`. Consequently,
unchecking the completion that carries Slogra's reward either rejects a valid
correction as spent gold (for example, a 2-base + 10-bonus completion with the
full 12 coins still available) or removes the bonus twice when the profile has
additional coins. The existing spent-gold test calls
`reconcileDailySoulCorrection` directly and does not exercise this integrated
path.

**Required fix:** Compute the base correction delta from `existingBaseCoins`
rather than the full persisted award, leaving the old-vs-new passive delta to
`reconcileDailySoulCorrection`. Add an integrated regression that unchecks the
bonus-bearing fifth completion with its full reward unspent and verifies that
the profile loses exactly the base coins plus one Slogra bonus.

**Resolved findings:** IR-001, IR-002, IR-003, IR-004.

## Round 4 — 2026-10-31

**Verdict: PASS**

### IR-005 — Blocking — Resolved

**Location:** `src/lib/dayCorrections.ts:534`;
`tests/dayCorrections.test.mjs:163-239`

`planDayCorrection` now subtracts only `existingBaseCoins` in its base correction,
preserving the persisted Slogra bonus for the subsequent old-versus-new passive
reconciliation. The integrated five-completion regression removes the
bonus-bearing completion and verifies that the profile and the four retained
completions both contain exactly 8 base coins afterward. The spent-bonus case
continues to assert rejection when the passive delta would make the balance
negative.

**Resolved findings:** IR-001, IR-002, IR-003, IR-004, IR-005.
