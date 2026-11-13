import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { DIFFICULTY_COINS, DIFFICULTY_XP, xpToNextLevel } from '../lib/gamification'
import { todayKey } from '../lib/date'
import { xpWithBonus } from '../lib/routes'
import { coinsAfterModifiers, xpAfterModifiers } from '../store/useBossStore'
import { tutorialCompletionPreview } from '../lib/tutorialPreview'
import type { PlayerProfile } from '../types'

type TutorialStep =
  | 'welcome'
  | 'tasks'
  | 'new-task'
  | 'pergamin'
  | 'save'
  | 'complete'
  | 'rewards'
  | 'finish'

const STEPS: TutorialStep[] = [
  'welcome',
  'tasks',
  'new-task',
  'pergamin',
  'save',
  'complete',
  'rewards',
  'finish',
]

const INSTRUCTIONS: Record<TutorialStep, string> = {
  welcome: 'Recorrerás un ejemplo de principio a fin. La tarea y las recompensas son una simulación: no se guardará nada.',
  tasks: 'Abre Tareas para ver dónde se crean los pergaminos y las obligaciones.',
  'new-task': 'Pulsa «+ Nueva» para empezar a crear una tarea.',
  pergamin: 'Elige «Pergamino»: es una tarea puntual, no una obligación recurrente.',
  save: 'Este ejemplo vence hoy y tiene dificultad fácil. Pulsa «Añadir» para verlo en la lista.',
  complete: 'Imagina que ya has terminado la tarea y pulsa «Completar» para registrar el avance.',
  rewards: 'Así se reflejan la EXP y las monedas. Los valores siguen las reglas actuales, pero solo se muestran en esta vista previa.',
  finish: '¡Ya conoces el flujo! Puedes probarlo con una tarea real o preparar un plan de hábitos.',
}

function HudPreview({
  level,
  xp,
  coins,
}: Readonly<{ level: number; xp: number; coins: number }>) {
  return (
    <div className="cv-panel flex flex-wrap items-center justify-between gap-2 p-2 font-pixel text-lg">
      <span>Nivel {level}</span>
      <span>EXP {xp}/{xpToNextLevel(level)}</span>
      <span>Monedas {coins}</span>
    </div>
  )
}

function GuidedTutorial({
  profile,
  onExit,
  onCreateTask,
  onCreatePlan,
}: Readonly<{
  profile: PlayerProfile
  onExit: () => void
  onCreateTask: () => void
  onCreatePlan: () => void
}>) {
  const [step, setStep] = useState<TutorialStep>('welcome')
  const [showForm, setShowForm] = useState(false)
  const [isPergamin, setIsPergamin] = useState(true)
  const [taskCreated, setTaskCreated] = useState(false)
  const [taskCompleted, setTaskCompleted] = useState(false)
  const [confirmExit, setConfirmExit] = useState(false)
  const dialogRef = useRef<HTMLElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const exitHeadingRef = useRef<HTMLHeadingElement>(null)
  const date = todayKey()
  const difficulty = 'easy'
  const item = { difficulty } as const
  const xpReward = xpAfterModifiers(
    xpWithBonus(DIFFICULTY_XP[difficulty], profile),
    date,
    item,
  )
  const coinReward = coinsAfterModifiers(DIFFICULTY_COINS[difficulty], date, item)
  const preview = tutorialCompletionPreview(profile, xpReward, coinReward)
  const stepIndex = STEPS.indexOf(step) + 1

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
    if (confirmExit) exitHeadingRef.current?.focus()
    else headingRef.current?.focus()
  }, [step, confirmExit])

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      if (confirmExit) setConfirmExit(false)
      else setConfirmExit(true)
      return
    }

    if (event.key !== 'Tab') return
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not(:disabled), input:not(:disabled), [href], [tabindex]:not([tabindex="-1"])',
    )
    if (!focusable?.length) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  const stepTo = (next: TutorialStep) => {
    setConfirmExit(false)
    setStep(next)
  }

  return (
    <section
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="guided-tutorial-title"
      aria-describedby="guided-tutorial-instructions"
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 overflow-y-auto bg-night-950/95 p-3 backdrop-blur"
    >
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col gap-3 py-2">
        <div className="flex items-center justify-between gap-3">
          <p className="cv-label">Tutorial guiado · Paso {stepIndex} de {STEPS.length}</p>
          <button
            type="button"
            onClick={() => setConfirmExit(true)}
            className="cv-btn cv-btn--ghost px-2 py-1"
          >
            Salir
          </button>
        </div>
        <div
          role="progressbar"
          aria-label={`Progreso del tutorial: paso ${stepIndex} de ${STEPS.length}`}
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-valuenow={stepIndex}
          className="cv-tutorial-progress"
        >
          <span style={{ width: `${(stepIndex / STEPS.length) * 100}%` }} />
        </div>
        <h1
          id="guided-tutorial-title"
          ref={headingRef}
          tabIndex={-1}
          className="cv-title text-center text-3xl focus:outline-none"
        >
          {step === 'welcome' ? 'Tu primer pergamino' : step === 'finish' ? '¡Lo has conseguido!' : 'Crear y completar una tarea'}
        </h1>

        <p
          id="guided-tutorial-instructions"
          aria-live="polite"
          className="cv-panel p-3 font-body text-silver-100"
        >
          <strong className="text-gold-300">Paso {stepIndex}.</strong> {INSTRUCTIONS[step]}
        </p>

        <p className="cv-tag cv-tag--gold self-start">
          Demostración aislada · No se guardan cambios ni recompensas
        </p>

        {confirmExit ? (
          <div
            role="alertdialog"
            aria-labelledby="tutorial-exit-title"
            aria-describedby="tutorial-exit-description"
            className="cv-panel flex flex-col gap-3 p-4"
          >
            <h2 id="tutorial-exit-title" ref={exitHeadingRef} tabIndex={-1} className="cv-shadow font-pixel text-2xl text-gold-300">
              ¿Salir del tutorial?
            </h2>
            <p id="tutorial-exit-description" className="font-body text-silver-200">
              La demostración se reiniciará cuando vuelvas a abrirla desde Perfil. No se guardará ninguna tarea ni recompensa.
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => setConfirmExit(false)} className="cv-btn cv-btn--ghost">
                Seguir tutorial
              </button>
              <button type="button" onClick={onExit} className="cv-btn cv-btn--blood">
                Salir
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="cv-panel flex flex-col gap-3 p-3">
              <HudPreview level={profile.level} xp={profile.xp} coins={profile.coins} />

              <div className="flex flex-wrap items-center justify-center gap-2 rounded border border-gold-600/40 bg-night-950/70 p-2">
                <span aria-hidden="true" className="cv-btn cv-btn--ghost">Hábitos</span>
                <button
                  type="button"
                  disabled={step !== 'tasks'}
                  aria-describedby={step === 'tasks' ? 'guided-tutorial-instructions' : undefined}
                  onClick={() => step === 'tasks' && stepTo('new-task')}
                  className={step === 'tasks' ? 'cv-btn cv-btn--gold cv-tutorial-highlight' : 'cv-btn cv-btn--ghost'}
                >
                  Tareas
                </button>
                <span aria-hidden="true" className="cv-btn cv-btn--ghost">Progreso</span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <h2 className="cv-shadow font-pixel text-2xl text-gold-300">Tareas</h2>
                <button
                  type="button"
                  disabled={step !== 'new-task'}
                  aria-describedby={step === 'new-task' ? 'guided-tutorial-instructions' : undefined}
                  onClick={() => {
                    if (step !== 'new-task') return
                    setShowForm(true)
                    stepTo('pergamin')
                  }}
                  className={step === 'new-task' ? 'cv-btn cv-btn--gold cv-tutorial-highlight' : 'cv-btn cv-btn--ghost'}
                >
                  + Nueva
                </button>
              </div>

              {!taskCreated && !showForm && (
                <p className="py-2 text-center font-pixel text-lg text-silver-400">
                  — SIN PERGAMINOS PENDIENTES —
                </p>
              )}

              {showForm && (
                <div className="cv-panel flex flex-col gap-3 p-3">
                  <h3 className="cv-label">Nueva tarea</h3>
                  <fieldset className="grid grid-cols-2 gap-2">
                    <legend className="sr-only">Tipo de tarea</legend>
                    <button
                      type="button"
                      disabled={step === 'save'}
                      aria-pressed={!isPergamin}
                      onClick={() => setIsPergamin(false)}
                      className={`cv-btn ${!isPergamin ? 'cv-btn--active' : ''}`}
                    >
                      Recurrente
                    </button>
                    <button
                      type="button"
                      aria-pressed={isPergamin}
                      disabled={step === 'save'}
                      aria-describedby={step === 'pergamin' ? 'guided-tutorial-instructions' : undefined}
                      onClick={() => {
                        if (step !== 'pergamin') return
                        setIsPergamin(true)
                        stepTo('save')
                      }}
                      className={`cv-btn ${step === 'pergamin' ? 'cv-tutorial-highlight' : isPergamin ? 'cv-btn--active' : ''}`}
                    >
                      Pergamino
                    </button>
                  </fieldset>

                  {isPergamin && (
                    <>
                      <label className="flex flex-col gap-1">
                        <span className="cv-label">Nombre</span>
                        <input value="Leer 10 páginas" readOnly className="cv-input" />
                      </label>
                      <div className="grid grid-cols-1 gap-2 font-body text-silver-200 sm:grid-cols-2">
                        <p>Dificultad: <strong>Fácil</strong></p>
                        <p>Vence: <strong>Hoy</strong></p>
                      </div>
                      <p className="font-body text-sm text-silver-300">Sin ruta asignada</p>
                      <button
                        type="button"
                        aria-describedby={step === 'save' ? 'guided-tutorial-instructions' : undefined}
                        onClick={() => {
                          if (step !== 'save') return
                          setShowForm(false)
                          setTaskCreated(true)
                          stepTo('complete')
                        }}
                        className={step === 'save' ? 'cv-btn cv-btn--gold cv-tutorial-highlight' : 'cv-btn cv-btn--ghost'}
                      >
                        Añadir
                      </button>
                    </>
                  )}
                </div>
              )}

              {taskCreated && (
                <article className={`cv-panel flex flex-col gap-2 p-3 ${taskCompleted ? 'cv-panel--gold' : ''}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="cv-shadow font-pixel text-xl text-silver-100">Leer 10 páginas</h3>
                    <span className="cv-tag cv-tag--gold">Pergamino · Fácil</span>
                  </div>
                  <p className="font-body text-sm text-silver-300">
                    {taskCompleted ? 'Completada en la demostración' : 'Vence hoy · Tarea puntual'}
                  </p>
                  {!taskCompleted && (
                    <button
                      type="button"
                      aria-describedby={step === 'complete' ? 'guided-tutorial-instructions' : undefined}
                      onClick={() => {
                        if (step !== 'complete') return
                        setTaskCompleted(true)
                        stepTo('rewards')
                      }}
                      className={step === 'complete' ? 'cv-btn cv-btn--gold cv-tutorial-highlight' : 'cv-btn cv-btn--ghost'}
                    >
                      Completar Leer 10 páginas
                    </button>
                  )}
                </article>
              )}
            </div>

            {step === 'welcome' && (
              <button type="button" onClick={() => stepTo('tasks')} className="cv-btn cv-btn--gold w-full">
                Empezar
              </button>
            )}

            {step === 'rewards' && (
              <section className="cv-panel flex flex-col gap-3 p-3" aria-labelledby="tutorial-reward-heading">
                <h2 id="tutorial-reward-heading" className="cv-label">Vista previa de recompensas</h2>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <p className="cv-label">Antes</p>
                    <HudPreview {...preview.before} />
                  </div>
                  <div>
                    <p className="cv-label">Después · Simulación</p>
                    <HudPreview {...preview.after} />
                  </div>
                </div>
                <p className="text-center font-pixel text-xl text-gold-300" role="status">
                  +{preview.xpReward} EXP · +{preview.coinReward} monedas
                </p>
                <p className="font-body text-sm text-silver-300">
                  Este resultado es una vista previa. Tu perfil real conserva los valores anteriores.
                </p>
                <button type="button" onClick={() => stepTo('finish')} className="cv-btn cv-btn--gold">
                  Continuar
                </button>
              </section>
            )}

            {step === 'finish' && (
              <div className="flex flex-col gap-2">
                <button type="button" onClick={onCreateTask} className="cv-btn cv-btn--gold">
                  Crear mi primer pergamino
                </button>
                <button type="button" onClick={onCreatePlan} className="cv-btn cv-btn--ghost">
                  Preparar un plan de hábitos
                </button>
                <button type="button" onClick={onExit} className="cv-btn cv-btn--ghost">
                  Ahora no
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}

export default GuidedTutorial
