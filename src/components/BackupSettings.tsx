import { useRef, useState, type ChangeEvent } from 'react'
import { exportBackup, importBackup } from '../lib/backup'

function BackupSettings() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<string | null>(null)

  const handleExport = async () => {
    await exportBackup()
    setStatus('Grimorio exportado.')
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await importBackup(file)
      setStatus('Grimorio restaurado. Recargando...')
      window.location.reload()
    } catch {
      setStatus('El archivo no es un grimorio válido.')
    } finally {
      e.target.value = ''
    }
  }

  return (
    <div>
      <p className="cv-shadow font-pixel text-xl leading-none text-silver-100">Grimorio</p>
      <p className="mt-0.5 font-body text-sm text-silver-500 italic">
        Todo vive solo en este dispositivo. Guarda una copia de vez en cuando.
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => void handleExport()} className="cv-btn">
          Guardar
        </button>
        <button type="button" onClick={() => fileInputRef.current?.click()} className="cv-btn">
          Cargar
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => void handleFileChange(e)}
        />
      </div>
      {status && <p className="mt-2 font-body text-sm text-gold-300 italic">{status}</p>}
    </div>
  )
}

export default BackupSettings
