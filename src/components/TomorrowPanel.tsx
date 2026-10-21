import type { Item } from '../types'
import SectionTitle from './SectionTitle'
import Skulls from './Skulls'

/** Vista de solo lectura de lo que espera mañana. No permite completar ni modificar nada. */
function TomorrowPanel({ items }: Readonly<{ items: Item[] }>) {
  return (
    <section className="flex flex-col gap-2">
      <SectionTitle>Mañana en el castillo</SectionTitle>
      {items.length === 0 ? (
        <p className="py-2 text-center font-pixel text-lg text-silver-700">
          — NADA PREVISTO PARA MAÑANA —
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="cv-panel flex items-center justify-between gap-3 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="break-words font-pixel text-xl leading-tight text-silver-100">
                  {item.title}
                </p>
                {item.zone && (
                  <p className="font-body text-sm text-silver-500 italic">{item.zone}</p>
                )}
              </div>
              <Skulls difficulty={item.difficulty} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default TomorrowPanel
