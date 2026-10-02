import { useState } from 'react'
import { COIN, COIN_PALETTE } from '../lib/pixelArt'
import { usePlayerStore } from '../store/usePlayerStore'
import { useRewardsStore } from '../store/useRewardsStore'
import PixelArt from './PixelArt'
import SectionTitle from './SectionTitle'

function RewardsShop() {
  const rewards = useRewardsStore((s) => s.rewards)
  const addReward = useRewardsStore((s) => s.addReward)
  const redeem = useRewardsStore((s) => s.redeem)
  const removeReward = useRewardsStore((s) => s.removeReward)
  const coins = usePlayerStore((s) => s.profile?.coins ?? 0)

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [cost, setCost] = useState(10)
  const [message, setMessage] = useState<string | null>(null)

  const handleAdd = async () => {
    if (!name.trim()) return
    await addReward(name.trim(), cost)
    setName('')
    setCost(10)
    setShowForm(false)
  }

  const handleRedeem = async (rewardId: string, rewardName: string) => {
    const ok = await redeem(rewardId)
    setMessage(ok ? `«${rewardName}» es tuyo. Disfrútalo, cazador.` : null)
  }

  return (
    <div className="cv-panel p-3">
      <SectionTitle
        action={
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="cv-btn px-2 py-1 text-base"
          >
            {showForm ? 'Cerrar' : '+ Nueva'}
          </button>
        }
      >
        El Bibliotecario
      </SectionTitle>
      <p className="mb-3 font-body text-sm text-silver-500 italic">
        «Tengo artículos muy raros... si puedes pagarlos.»
      </p>

      {showForm && (
        <div className="mb-3 flex flex-col gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ver un capítulo, un café, un capricho..."
            className="cv-input"
          />
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              value={cost}
              onChange={(e) => setCost(Number(e.target.value))}
              className="cv-input w-24"
              aria-label="Precio en oro"
            />
            <button
              type="button"
              onClick={() => void handleAdd()}
              className="cv-btn cv-btn--gold flex-1"
            >
              Añadir al catálogo
            </button>
          </div>
        </div>
      )}

      {rewards.length === 0 && !showForm && (
        <p className="py-2 font-pixel text-lg text-silver-700">— CATÁLOGO VACÍO —</p>
      )}

      <ul className="flex flex-col divide-y divide-silver-700/30">
        {rewards.map((reward) => {
          const canAfford = coins >= reward.cost
          return (
            <li key={reward.id} className="flex items-center gap-2 py-2">
              <p
                className={`cv-shadow min-w-0 flex-1 truncate font-pixel text-xl leading-none ${canAfford ? 'text-silver-100' : 'text-silver-500'}`}
              >
                {reward.name}
              </p>
              <span className="flex items-center gap-1 font-pixel text-xl leading-none text-gold-300">
                <PixelArt rows={COIN} palette={COIN_PALETTE} scale={2} />
                {reward.cost}
              </span>
              <button
                type="button"
                disabled={!canAfford}
                onClick={() => void handleRedeem(reward.id, reward.name)}
                className="cv-btn px-2 py-1 text-base"
              >
                Comprar
              </button>
              <button
                type="button"
                onClick={() => void removeReward(reward.id)}
                className="cv-btn cv-btn--ghost px-1 py-1 text-base hover:text-blood-400"
                aria-label={`Eliminar ${reward.name}`}
              >
                ✕
              </button>
            </li>
          )
        })}
      </ul>

      {message && (
        <p className="mt-2 font-body text-sm text-gold-300 italic">{message}</p>
      )}
    </div>
  )
}

export default RewardsShop
