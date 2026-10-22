import { format, parseISO } from 'date-fns'
import { useEffect, useState } from 'react'
import PageHeader from '../components/PageHeader'
import SectionTitle from '../components/SectionTitle'
import { db } from '../db/database'
import type { ItemEvent } from '../types'

const PROTECTION_LABEL: Record<NonNullable<ItemEvent['protectedBy']>, string> = {
  shield: 'Protegida por escudo',
  freeze: 'Protegida por congelación',
}

function describeMiss(event: ItemEvent): string {
  if (event.protectedBy) return PROTECTION_LABEL[event.protectedBy]
  return `Daño ${event.damage ?? 0}`
}

function FailureHistoryPage() {
  const [misses, setMisses] = useState<ItemEvent[] | null>(null)

  useEffect(() => {
    void db.itemEvents
      .where('kind')
      .equals('missed')
      .toArray()
      .then((events) => setMisses(events.sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate))))
  }, [])

  const groups = (misses ?? []).reduce<Record<string, ItemEvent[]>>((acc, event) => {
    acc[event.scheduledDate] ??= []
    acc[event.scheduledDate].push(event)
    return acc
  }, {})

  return (
    <>
      <PageHeader title="Histórico de fallos" subtitle="Cada obligación que no llegó a cumplirse." />
      <section className="relative z-10 flex flex-col gap-3 px-3">
        {misses === null ? (
          <p className="py-8 text-center font-body text-silver-400">Consultando el registro...</p>
        ) : misses.length === 0 ? (
          <p className="py-8 text-center font-pixel text-xl text-silver-500">— SIN FALLOS REGISTRADOS —</p>
        ) : (
          Object.entries(groups).map(([date, events]) => (
            <div key={date} className="cv-panel p-3">
              <SectionTitle>{format(parseISO(date), 'dd/MM/yyyy')}</SectionTitle>
              <ul className="mt-2 flex flex-col gap-1.5">
                {events.map((event) => (
                  <li key={event.id} className="flex items-baseline justify-between gap-2">
                    <span className="min-w-0 break-words font-pixel text-xl text-silver-100">{event.itemTitle}</span>
                    <span className="shrink-0 font-body text-sm italic text-blood-400">{describeMiss(event)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
    </>
  )
}

export default FailureHistoryPage
