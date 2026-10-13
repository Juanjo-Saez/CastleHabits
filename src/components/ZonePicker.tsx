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
        <label htmlFor={id} className="cv-label">Zona</label>
        <button
          type="button"
          onClick={() => setShowLegend((visible) => !visible)}
          aria-label="Mostrar equivalencias de las zonas"
          aria-expanded={showLegend}
          aria-controls={`${id}-legend`}
          title="Equivalencias de las zonas"
          className="flex size-7 items-center justify-center border border-gold-600/50 font-pixel text-sm text-gold-300 hover:border-gold-400 hover:text-gold-200"
        >
          ⓘ
        </button>
      </div>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="cv-input"
      >
        <option value="">Sin zona</option>
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