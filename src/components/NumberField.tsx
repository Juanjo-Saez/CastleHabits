import { useEffect, useState } from 'react'

/**
 * Entero editable con un rango. Permite borrar el campo mientras se escribe:
 * solo notifica valores válidos y restaura el último valor válido al salir.
 */
function NumberField({
  value,
  min,
  max,
  onCommit,
  disabled = false,
  ariaLabel,
  className = 'cv-input w-20',
}: Readonly<{
  value: number
  min: number
  max: number
  onCommit: (next: number) => void
  disabled?: boolean
  ariaLabel: string
  className?: string
}>) {
  const [text, setText] = useState(String(value))

  useEffect(() => {
    setText(String(value))
  }, [value])

  const parse = (raw: string): number | null => {
    if (raw.trim() === '') return null
    const n = Number(raw)
    return Number.isInteger(n) && n >= min && n <= max ? n : null
  }

  return (
    <input
      type="number"
      min={min}
      max={max}
      value={text}
      disabled={disabled}
      onChange={(e) => {
        setText(e.target.value)
        const n = parse(e.target.value)
        if (n !== null) onCommit(n)
      }}
      onBlur={() => {
        const n = parse(text)
        setText(String(n ?? value))
      }}
      className={className}
      aria-label={ariaLabel}
    />
  )
}

export default NumberField
