import { DIFFICULTY_LABEL } from '../lib/gamification'
import type { Difficulty } from '../types'
import Skulls from './Skulls'

const DIFFICULTIES: Difficulty[] = ['trivial', 'easy', 'medium', 'hard']

function DifficultyPicker({
  value,
  onChange,
}: Readonly<{ value: Difficulty; onChange: (d: Difficulty) => void }>) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {DIFFICULTIES.map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => onChange(d)}
          className={`cv-btn flex items-center justify-between gap-2 px-2 ${value === d ? 'cv-btn--active' : ''}`}
        >
          <span>{DIFFICULTY_LABEL[d]}</span>
          <Skulls difficulty={d} scale={1} />
        </button>
      ))}
    </div>
  )
}

export default DifficultyPicker
