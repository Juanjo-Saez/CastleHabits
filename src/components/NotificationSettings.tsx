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
    setPermission(await requestNotificationPermission())
  }

  let status = 'Inactivos'
  let hint = 'Recibe un aviso si quedan velas por encender.'
  if (!isNotificationSupported()) {
    status = 'No disponible'
    hint = 'Este navegador no admite notificaciones.'
  } else if (permission === 'granted') {
    status = 'Activos'
    hint = 'Avisan mientras el castillo siga abierto en una pestaña.'
  } else if (permission === 'denied') {
    status = 'Bloqueados'
    hint = 'Actívalos desde los ajustes del navegador.'
  }

  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="cv-shadow font-pixel text-xl leading-none text-silver-100">
          Recordatorios{' '}
          <span className={permission === 'granted' ? 'text-gold-300' : 'text-silver-500'}>
            [{status}]
          </span>
        </p>
        <p className="mt-0.5 font-body text-sm text-silver-500 italic">{hint}</p>
      </div>
      {isNotificationSupported() && permission === 'default' && (
        <button type="button" onClick={() => void handleEnable()} className="cv-btn cv-btn--gold">
          Activar
        </button>
      )}
    </div>
  )
}

export default NotificationSettings
