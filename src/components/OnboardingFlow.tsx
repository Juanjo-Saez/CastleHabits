import { useEffect, useRef, useState } from 'react'
import {
  ONBOARDING_GOALS,
  createSideQuestInput,
  recommendActivities,
  type OnboardingActivity,
  type OnboardingGoal,
} from '../lib/onboardingPlan'
import { useItemsStore } from '../store/useItemsStore'
import WeekdayPicker from './WeekdayPicker'

type Step = 'objectives' | 'availability' | 'review' | 'saved'

function ActivityEditor({
  activity,
  onChange,
  onRemove,
}: Readonly<{
  activity: OnboardingActivity
  onChange: (changes: Partial<OnboardingActivity>) => void
  onRemove: () => void
}>) {
  return (
    <article className="cv-panel flex flex-col gap-3 p-3">
      <div className="flex items-start gap-2">
        <label className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="cv-label">Actividad</span>
          <input
            value={activity.title}
            onChange={(event) => onChange({ title: event.target.value })}
            maxLength={80}
            className="cv-input"
          />
        </label>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Quitar ${activity.title || 'actividad'}`}
          className="cv-btn cv-btn--ghost mt-5 shrink-0 px-2 py-1"
        >
          Quitar
        </button>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="cv-label">Cómo registrar el avance</legend>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            aria-pressed={activity.trackingType === 'boolean'}
            onClick={() => onChange({ trackingType: 'boolean' })}
            className={`cv-btn ${activity.trackingType === 'boolean' ? 'cv-btn--active' : ''}`}
          >
            Hecho / No hecho
          </button>
          <button
            type="button"
            aria-pressed={activity.trackingType === 'quantity'}
            onClick={() => onChange({
              trackingType: 'quantity',
              quantityGoal: activity.quantityGoal ?? 10,
              unit: activity.unit ?? 'min',
            })}
            className={`cv-btn ${activity.trackingType === 'quantity' ? 'cv-btn--active' : ''}`}
          >
            Cantidad
          </button>
        </div>
      </fieldset>

      {activity.trackingType === 'quantity' && (
        <div className="flex gap-2">
          <label className="flex w-28 flex-col gap-1">
            <span className="cv-label">Meta</span>
            <input
              type="number"
              min={1}
              value={activity.quantityGoal ?? 10}
              onChange={(event) => onChange({ quantityGoal: Number(event.target.value) })}
              className="cv-input"
            />
          </label>
          <label className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="cv-label">Unidad</span>
            <input
              value={activity.unit ?? ''}
              onChange={(event) => onChange({ unit: event.target.value })}
              maxLength={20}
              className="cv-input"
            />
          </label>
        </div>
      )}

      <WeekdayPicker
        label="Propuesta: una vez por semana, en estos días"
        value={activity.weekdays}
        onChange={(weekdays) => onChange({ weekdays })}
      />
    </article>
  )
}

function OnboardingFlow({
  onClose,
  onGoToHabits,
}: Readonly<{
  onClose: () => void
  onGoToHabits: () => void
}>) {
  const [step, setStep] = useState<Step>('objectives')
  const [goals, setGoals] = useState<OnboardingGoal[]>([])
  const [availableWeekdays, setAvailableWeekdays] = useState<number[]>([])
  const [activities, setActivities] = useState<OnboardingActivity[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const customActivityCount = useRef(0)
  const saveOnboardingPlan = useItemsStore((state) => state.saveOnboardingPlan)

  useEffect(() => {
    const activeElement = document.activeElement
    const restoreTarget = activeElement instanceof HTMLElement && activeElement !== document.body
      ? activeElement
      : document.getElementById('main-content')
    return () => {
      if (restoreTarget?.isConnected) restoreTarget.focus()
      else document.getElementById('main-content')?.focus()
    }
  }, [])

  useEffect(() => {
    headingRef.current?.focus()
  }, [step])

  const updateActivity = (id: string, changes: Partial<OnboardingActivity>) => {
    setActivities((current) =>
      current.map((activity) => activity.id === id ? { ...activity, ...changes } : activity),
    )
  }

  const toggleGoal = (goal: OnboardingGoal) => {
    setGoals((current) => {
      if (current.includes(goal)) return current.filter((value) => value !== goal)
      return current.length < 3 ? [...current, goal] : current
    })
  }

  const continueFromAvailability = () => {
    if (availableWeekdays.length === 0) {
      setError('Elige al menos un día disponible para preparar una propuesta.')
      return
    }
    setError(null)
    setActivities(recommendActivities(goals, availableWeekdays))
    setStep('review')
  }

  const addCustomActivity = () => {
    setActivities((current) => [
      ...current,
      {
        id: `custom-${customActivityCount.current + 1}`,
        title: '',
        difficulty: 'easy',
        trackingType: 'boolean',
        weekdays: availableWeekdays.slice(0, 1),
        custom: true,
      },
    ])
    customActivityCount.current += 1
  }

  const savePlan = async () => {
    if (activities.some((activity) =>
      !activity.title.trim() ||
      activity.weekdays.length === 0 ||
      activity.trackingType === 'quantity' &&
        (!Number.isFinite(activity.quantityGoal) || (activity.quantityGoal ?? 0) < 1) ||
      activity.trackingType === 'quantity' && !activity.unit?.trim(),
    )) {
      setError('Completa el nombre, la frecuencia y los datos de cantidad de cada actividad.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      if (activities.length > 0) {
        await saveOnboardingPlan(activities.map(createSideQuestInput))
      }
      setStep('saved')
    } catch (cause) {
      setError(cause instanceof Error
        ? `No se pudo guardar el plan: ${cause.message}`
        : 'No se pudo guardar el plan. Inténtalo de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const skip = () => {
    setError(null)
    onClose()
  }

  const heading = {
    objectives: '¿Qué quieres conseguir?',
    availability: 'Elige tus días disponibles',
    review: 'Revisa tu propuesta',
    saved: 'Tu plan está listo',
  }[step]

  const renderStep = () => {
    switch (step) {
      case 'objectives':
        return (
          <>
            <p className="font-body text-silver-200">
              Elige hasta tres objetivos. Prepararemos ideas sencillas que podrás cambiar antes de guardarlas.
            </p>
            <fieldset className="flex flex-col gap-2">
              <legend className="cv-label">Mis objetivos (máximo 3)</legend>
              {ONBOARDING_GOALS.map((goal) => {
                const checked = goals.includes(goal.id)
                const disabled = !checked && goals.length >= 3
                return (
                  <label
                    key={goal.id}
                    className={`cv-panel flex min-h-12 items-center gap-3 p-3 ${disabled ? 'opacity-55' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggleGoal(goal.id)}
                      className="size-5 accent-amber-400"
                    />
                    <span aria-hidden="true" className="text-xl">{goal.icon}</span>
                    <span className="font-body text-silver-100">{goal.label}</span>
                  </label>
                )
              })}
            </fieldset>
            {error && <p role="alert" className="font-body text-blood-300">{error}</p>}
            <div className="flex justify-end">
              <button
                type="button"
                disabled={goals.length === 0}
                onClick={() => { setError(null); setStep('availability') }}
                className="cv-btn cv-btn--gold"
              >
                Continuar
              </button>
            </div>
          </>
        )

      case 'availability':
        return (
          <>
            <p className="font-body text-silver-200">
              Marca los días que suelen venirte bien. Cada sugerencia empezará una vez por semana; luego podrás añadir días.
            </p>
            <WeekdayPicker value={availableWeekdays} onChange={setAvailableWeekdays} />
            {error && <p role="alert" className="font-body text-blood-300">{error}</p>}
            <div className="flex justify-between gap-2">
              <button type="button" onClick={() => { setError(null); setStep('objectives') }} className="cv-btn cv-btn--ghost">
                Atrás
              </button>
              <button type="button" onClick={continueFromAvailability} className="cv-btn cv-btn--gold">
                Preparar propuesta
              </button>
            </div>
          </>
        )

      case 'review':
        return (
          <>
            <p className="font-body text-silver-200">
              Son actividades voluntarias: puedes editarlas o dejarlas pendientes sin perder vida. Solo se guardarán cuando confirmes.
            </p>
            {activities.length === 0 ? (
              <div className="cv-panel p-3">
                <p className="font-body text-silver-200">No hay sugerencias para estos objetivos. Puedes añadir una actividad propia.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {activities.map((activity) => (
                  <ActivityEditor
                    key={activity.id}
                    activity={activity}
                    onChange={(changes) => updateActivity(activity.id, changes)}
                    onRemove={() => setActivities((current) => current.filter((value) => value.id !== activity.id))}
                  />
                ))}
              </div>
            )}
            <button type="button" onClick={addCustomActivity} className="cv-btn cv-btn--ghost w-full">
              + Añadir una actividad propia
            </button>
            {error && <p role="alert" className="font-body text-blood-300">{error}</p>}
            <div className="flex justify-between gap-2">
              <button type="button" onClick={() => { setError(null); setStep('availability') }} className="cv-btn cv-btn--ghost">
                Atrás
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void savePlan()}
                className="cv-btn cv-btn--gold"
              >
                {saving ? 'Guardando…' : activities.length > 0 ? 'Guardar y continuar' : 'Continuar sin actividades'}
              </button>
            </div>
          </>
        )

      case 'saved':
        return (
          <>
            <p className="font-body text-silver-200">
              {activities.length > 0
                ? `Has añadido ${activities.length} ${activities.length === 1 ? 'actividad voluntaria' : 'actividades voluntarias'} a Hábitos. Puedes editarlas o archivarlas cuando quieras.`
                : 'No has añadido actividades. Puedes preparar otro plan cuando quieras.'}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              {activities.length > 0 && (
                <button type="button" onClick={onGoToHabits} className="cv-btn cv-btn--gold">
                  Ir a Hábitos
                </button>
              )}
              <button type="button" onClick={onClose} className="cv-btn cv-btn--ghost">
                Terminar
              </button>
            </div>
          </>
        )
    }
  }

  const stepIndex = step === 'objectives' ? 1 : step === 'availability' ? 2 : 3
  const stepCount = 3

  return (
    <section
      aria-labelledby="onboarding-title"
      className="relative z-10 mx-auto flex w-full max-w-md flex-col gap-4 px-3 py-5"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="cv-label">Plan de hábitos · {step === 'saved' ? 'Completado' : `Paso ${stepIndex} de ${stepCount}`}</p>
        <button type="button" onClick={skip} className="cv-btn cv-btn--ghost px-2 py-1">
          Cerrar
        </button>
      </div>
      <h1
        id="onboarding-title"
        ref={headingRef}
        tabIndex={-1}
        className="cv-title text-center text-3xl focus:outline-none"
      >
        {heading}
      </h1>
      {renderStep()}
      <p className="font-body text-xs text-silver-400">
        Las actividades sugeridas son voluntarias. Puedes editar este plan más adelante desde Hábitos.
      </p>
    </section>
  )
}

export default OnboardingFlow
