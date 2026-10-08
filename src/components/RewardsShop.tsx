import { useState } from 'react'
import { COIN, COIN_PALETTE } from '../lib/pixelArt'
import { SYSTEM_RESOURCES } from '../lib/resources'
import { effectiveMaxHp, shopPrice } from '../lib/routes'
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
  const postponeTokens = usePlayerStore((s) => s.profile?.postponeTokens ?? 0)
  const buyPostponeTokens = usePlayerStore((s) => s.buyPostponeTokens)
  const vitalityPotions = usePlayerStore((s) => s.profile?.vitalityPotions ?? 0)
  const hp = usePlayerStore((s) => s.profile?.hp ?? 0)
  const maxHp = usePlayerStore((s) => (s.profile ? effectiveMaxHp(s.profile) : 0))
  const profile = usePlayerStore((s) => s.profile)
  const buyVitalityPotion = usePlayerStore((s) => s.buyVitalityPotion)
  const consumeVitalityPotion = usePlayerStore((s) => s.consumeVitalityPotion)
  const streakFreezes = usePlayerStore((s) => s.profile?.streakFreezes ?? 0)
  const buyStreakFreeze = usePlayerStore((s) => s.buyStreakFreeze)

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [cost, setCost] = useState(10)
  const [message, setMessage] = useState<string | null>(null)

  const postponePacks = SYSTEM_RESOURCES.postponeToken.packPrices.map((pack) => ({
    quantity: pack.quantity,
    cost: shopPrice(pack.cost, profile),
  }))
  const potionCost = shopPrice(SYSTEM_RESOURCES.vitalityPotion.cost, profile)
  const freezeCost = shopPrice(SYSTEM_RESOURCES.streakFreeze.cost, profile)

  const handleAdd = async () => {
    if (!name.trim()) return
    await addReward(name.trim(), cost)
    setName('')
    setCost(10)
    setShowForm(false)
  }

  const handleBuyPostponeTokens = async (quantity: number, cost: number) => {
    const ok = await buyPostponeTokens(quantity, cost)
    const suffix = quantity === 1 ? '' : 's'
    setMessage(ok ? `Has comprado ${quantity} sello${suffix} de aplazamiento.` : 'No tienes oro suficiente.')
  }

  const handleBuyVitalityPotion = async () => {
    const ok = await buyVitalityPotion(potionCost)
    setMessage(ok ? 'Has comprado una poción de vigor.' : 'No tienes oro suficiente.')
  }

  const handleUseVitalityPotion = async () => {
    const ok = await consumeVitalityPotion()
    setMessage(ok ? 'La poción restaura 10 puntos de vitalidad.' : 'No puedes usar una poción ahora.')
  }

  const handleBuyStreakFreeze = async () => {
    const ok = await buyStreakFreeze(freezeCost)
    setMessage(ok ? 'Has comprado una congelación de racha.' : 'No tienes oro suficiente.')
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

      <div className="mb-3 border-y border-gold-600/30 py-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="cv-shadow font-pixel text-xl leading-none text-silver-100">
              Sellos de aplazamiento
            </p>
            <p className="mt-1 font-body text-sm text-silver-500 italic">
              Disponibles: {postponeTokens}. {SYSTEM_RESOURCES.postponeToken.description}
            </p>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {postponePacks.map((pack) => (
            <button
              key={pack.quantity}
              type="button"
              disabled={coins < pack.cost}
              onClick={() => void handleBuyPostponeTokens(pack.quantity, pack.cost)}
              className="cv-btn px-1 py-1 text-sm"
            >
              +{pack.quantity} · {pack.cost} oro
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 grid gap-2 border-b border-gold-600/30 pb-3 sm:grid-cols-2">
        <div className="border border-silver-700/30 p-2">
          <p className="cv-shadow font-pixel text-lg leading-none text-silver-100">Poción de vigor</p>
          <p className="mt-1 font-body text-sm text-silver-500 italic">
            Tienes {vitalityPotions}. {SYSTEM_RESOURCES.vitalityPotion.description}
          </p>
          <div className="mt-2 flex gap-1.5">
            <button
              type="button"
              disabled={coins < potionCost}
              onClick={() => void handleBuyVitalityPotion()}
              className="cv-btn flex-1 px-1 py-1 text-sm"
            >
              Comprar · {potionCost}
            </button>
            <button
              type="button"
              disabled={vitalityPotions <= 0 || hp >= maxHp}
              onClick={() => void handleUseVitalityPotion()}
              className="cv-btn cv-btn--gold flex-1 px-1 py-1 text-sm"
            >
              Usar
            </button>
          </div>
        </div>

        <div className="border border-silver-700/30 p-2">
          <p className="cv-shadow font-pixel text-lg leading-none text-silver-100">Congelación de racha</p>
          <p className="mt-1 font-body text-sm text-silver-500 italic">
            Disponibles: {streakFreezes}. {SYSTEM_RESOURCES.streakFreeze.description}
          </p>
          <button
            type="button"
            disabled={coins < freezeCost}
            onClick={() => void handleBuyStreakFreeze()}
            className="cv-btn mt-2 w-full px-1 py-1 text-sm"
          >
            Comprar · {freezeCost} oro
          </button>
        </div>
      </div>

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
          const price = shopPrice(reward.cost, profile)
          const canAfford = coins >= price
          return (
            <li key={reward.id} className="flex items-center gap-2 py-2">
              <p
                className={`cv-shadow min-w-0 flex-1 truncate font-pixel text-xl leading-none ${canAfford ? 'text-silver-100' : 'text-silver-500'}`}
              >
                {reward.name}
              </p>
              <span className="flex items-center gap-1 font-pixel text-xl leading-none text-gold-300">
                <PixelArt rows={COIN} palette={COIN_PALETTE} scale={2} />
                {price}
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
