import { useEffect, useState } from 'react'
import { hasSeenBossNotice, markBossNoticeSeen } from '../lib/bossMarker'
import { lastResolved, summarizeBoss } from '../lib/bosses'
import { todayKey } from '../lib/date'
import { chooseDeathStake, useBossStore } from '../store/useBossStore'
import { useDailySummaryStore } from '../store/useDailySummaryStore'
import { useItemsStore } from '../store/useItemsStore'
import { usePlayerStore } from '../store/usePlayerStore'
import type { BossEncounter } from '../types'
import BossDialog from './BossDialog'

function noticeToken(encounter: BossEncounter): string {
  return `${encounter.createdAt}:${encounter.status}`
}

/** Modal que anuncia una vez el resultado de un encuentro al entrar al Castillo. */
function BossAnnouncement({
  onResultPendingChange,
}: Readonly<{
  onResultPendingChange?: (pending: boolean) => void
}>) {
  const encounters = useBossStore((s) => s.encounters)
  const items = useItemsStore((s) => s.items)
  const completionsByItem = useItemsStore((s) => s.completionsByItem)
  const dead = usePlayerStore((s) => s.profile?.dead ?? false)
  const summaryOpen = useDailySummaryStore((s) => s.open)
  const [dismissed, setDismissed] = useState<string[]>([])

  const resolved = lastResolved(encounters)
  const pending = [
    resolved && { encounter: resolved, mode: 'result' as const },
  ].find((entry) => entry && !dismissed.includes(noticeToken(entry.encounter))
    && !hasSeenBossNotice(noticeToken(entry.encounter)))

  const resultPending = Boolean(pending?.mode === 'result')
  useEffect(() => {
    onResultPendingChange?.(resultPending)
  }, [onResultPendingChange, resultPending])

  if (dead || summaryOpen || !pending) return null

  const token = noticeToken(pending.encounter)
  return (
    <BossDialog
      key={token}
      summary={summarizeBoss(pending.encounter, items, completionsByItem, todayKey())}
      mode={pending.mode}
      onDeathStake={chooseDeathStake}
      onClose={() => {
        markBossNoticeSeen(token)
        setDismissed((tokens) => [...tokens, token])
      }}
    />
  )
}

export default BossAnnouncement
