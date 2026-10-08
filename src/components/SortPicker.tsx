import { TASK_SORT_LABEL, type TaskSortKey } from '../lib/taskSort'

const KEYS = Object.keys(TASK_SORT_LABEL) as TaskSortKey[]

function SortPicker({
  value,
  onChange,
}: Readonly<{ value: TaskSortKey; onChange: (key: TaskSortKey) => void }>) {
  return (
    <div className="flex items-center gap-2">
      <span className="cv-label shrink-0">Orden</span>
      <div className="flex flex-1 flex-wrap gap-1.5">
        {KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            aria-pressed={value === key}
            className={`cv-btn flex-1 px-2 py-1 text-sm ${value === key ? 'cv-btn--active' : ''}`}
          >
            {TASK_SORT_LABEL[key]}
          </button>
        ))}
      </div>
    </div>
  )
}

export default SortPicker
