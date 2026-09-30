import { useState } from 'react'
import {
  getNotificationPermission,
  isNotificationSupported,
  requestNotificationPermission,
} from '../lib/notifications'

function NotificationSettings() {
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    getNotificationPermission(),
  )

  const handleEnable = async () => {
    const result = await requestNotificationPermission()
    setPermission(result)
  }

  let message = 'Actívalos para recibir un aviso si dejas tareas pendientes hoy.'
  if (!isNotificationSupported()) {
    message = 'Este navegador no admite notificaciones.'
  } else if (permission === 'granted') {
    message = 'Activos mientras el Castillo permanezca abierto en una pestaña.'
  } else if (permission === 'denied') {
    message = 'Bloqueados. Actívalos desde los ajustes del navegador.'
  }

  return (
    <div className="rounded-sm border border-gold-600/30 bg-crypt-900/60 p-4">
      <p className="font-heading text-sm tracking-wide text-parchment-100">
        Recordatorios
      </p>
      <p className="mt-1 text-xs italic text-parchment-500">{message}</p>
      {isNotificationSupported() && permission === 'default' && (
        <button
          type="button"
          onClick={() => void handleEnable()}
          className="mt-3 rounded-sm border border-gold-500/60 bg-gold-500/10 px-4 py-1.5 font-heading text-xs tracking-wide text-gold-400 hover:bg-gold-500/20"
        >
          Activar recordatorios
        </button>
      )}
    </div>
  )
}

export default NotificationSettings
