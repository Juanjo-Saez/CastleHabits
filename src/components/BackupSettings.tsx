import { useRef, useState } from 'react'
import { exportBackup, importBackup } from '../lib/backup'

function BackupSettings() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<string | null>(null)

  const handleExport = async () => {
    await exportBackup()
    setStatus('Grimorio exportado.')
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await importBackup(file)
      setStatus('Grimorio restaurado. Recargando...')
      window.location.reload()
    } catch {
      setStatus('El archivo no es un backup válido.')
    } finally {
      e.target.value = ''
    }
  }

  return (
    <div className="rounded-sm border border-gold-600/30 bg-crypt-900/60 p-4">
      <p className="font-heading text-sm tracking-wide text-parchment-100">
        Copia de Seguridad
      </p>
      <p className="mt-1 text-xs italic text-parchment-500">
        Todo se guarda solo en este dispositivo. Exporta el grimorio de vez en
        cuando para no perder tu progreso.
      </p>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => void handleExport()}
          className="flex-1 rounded-sm border border-gold-500/60 bg-gold-500/10 px-3 py-1.5 font-heading text-xs tracking-wide text-gold-400 hover:bg-gold-500/20"
        >
          Exportar
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 rounded-sm border border-parchment-500/30 px-3 py-1.5 font-heading text-xs tracking-wide text-parchment-300 hover:border-gold-500/60"
        >
          Importar
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => void handleFileChange(e)}
        />
      </div>

      {status && (
        <p className="mt-2 text-xs italic text-gold-400">{status}</p>
      )}
    </div>
  )
}

export default BackupSettings
