import { useId, useState } from 'react'
import { ZONES } from '../lib/zones'

function ZonePicker({
  value,
  onChange,
}: Readonly<{
  value: string
  onChange: (zone: string) => void
}>) {
  const id = useId()
  const [showLegend, setShowLegend] = useState(false)
  const isLegacyZone = value !== '' && !ZONES.some((zone) => zone.name === value)

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="cv-label">Estancia</label>
        <button
          type="button"
          onClick={() => setShowLegend((visible) => !visible)}
          aria-label={showLegend ? 'Ocultar equivalencias de las estancias' : 'Mostrar equivalencias de las estancias'}
          aria-expanded={showLegend}
          aria-controls={`${id}-legend`}
          title="Equivalencias de las estancias"
          className="cv-btn cv-btn--gold flex size-7 items-center justify-center !p-0 text-xl"
        >
          ?
        </button>
      </div>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="cv-input"
      >
        {isLegacyZone && <option value={value}>Anterior: {value}</option>}
        {ZONES.map((zone) => (
          <option key={zone.name} value={zone.name}>{zone.name}</option>
        ))}
      </select>
      {showLegend && (
        <dl
          id={`${id}-legend`}
          className="grid grid-cols-2 gap-x-3 gap-y-1 border border-gold-600/30 bg-crypt-950/80 p-2 font-body text-sm"
        >
          {ZONES.map((zone) => (
            <div key={zone.name} className="contents">
              <dt className="text-gold-300">{zone.name}</dt>
              <dd className="text-right text-silver-300">{zone.home}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}

export default ZonePicker