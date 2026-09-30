import { useState } from 'react'
import { usePlayerStore } from '../store/usePlayerStore'
import { useRewardsStore } from '../store/useRewardsStore'

const inputClasses =
  'rounded-sm border border-gold-600/30 bg-crypt-950 px-3 py-2 font-body text-sm text-parchment-100 placeholder:text-parchment-500/60 focus:border-gold-500 focus:outline-none'

function RewardsShop() {
  const rewards = useRewardsStore((s) => s.rewards)
  const addReward = useRewardsStore((s) => s.addReward)
  const redeem = useRewardsStore((s) => s.redeem)
  const removeReward = useRewardsStore((s) => s.removeReward)
  const coins = usePlayerStore((s) => s.profile?.coins ?? 0)

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [cost, setCost] = useState(10)

  const handleAdd = async () => {
    if (!name.trim()) return
    await addReward(name.trim(), cost)
    setName('')
    setCost(10)
    setShowForm(false)
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-heading text-xs tracking-widest text-parchment-500 uppercase">
          Reliquias y Recompensas
        </h2>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="font-heading text-xs tracking-wide text-gold-400 hover:text-gold-300"
        >
          {showForm ? 'Cerrar' : '+ Nueva'}
        </button>
      </div>

      {showForm && (
        <div className="mb-3 flex flex-col gap-2 rounded-sm border border-gold-600/30 bg-crypt-900/80 p-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre de la recompensa..."
            className={inputClasses}
          />
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              value={cost}
              onChange={(e) => setCost(Number(e.target.value))}
              className={`${inputClasses} w-24`}
            />
            <button
              type="button"
              onClick={() => void handleAdd()}
              className="flex-1 rounded-sm border border-gold-500/60 bg-gold-500/10 px-3 py-1.5 font-heading text-xs tracking-wide text-gold-400 hover:bg-gold-500/20"
            >
              Grabar en el grimorio
            </button>
          </div>
        </div>
      )}

      {rewards.length === 0 && !showForm && (
        <p className="px-1 py-2 text-xs italic text-parchment-500">
          Aún no has definido recompensas para canjear tus monedas.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {rewards.map((reward) => {
          const canAfford = coins >= reward.cost
          return (
            <div
              key={reward.id}
              className="flex items-center gap-3 rounded-sm border border-gold-600/20 bg-crypt-900/60 px-4 py-3"
            >
              <span className="text-xl">💰</span>
              <div className="min-w-0 flex-1">
                <p className="font-heading text-sm tracking-wide text-parchment-100">
                  {reward.name}
                </p>
                <p className="text-xs italic text-parchment-500">
                  {reward.cost} monedas
                </p>
              </div>
              <button
                type="button"
                disabled={!canAfford}
                onClick={() => void redeem(reward.id)}
                className={`rounded-sm border px-3 py-1.5 font-heading text-xs tracking-wide ${
                  canAfford
                    ? 'border-gold-500/60 bg-gold-500/10 text-gold-400 hover:bg-gold-500/20'
                    : 'border-parchment-500/20 text-parchment-500/40'
                }`}
              >
                Canjear
              </button>
              <button
                type="button"
                onClick={() => void removeReward(reward.id)}
                className="text-parchment-500/50 hover:text-blood-400"
                aria-label="Eliminar recompensa"
              >
                ✕
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default RewardsShop
