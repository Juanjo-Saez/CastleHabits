/** Arpegio ascendente sintetizado con Web Audio API, sin necesidad de archivos de audio. */
export function playLevelUpChime(): void {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    const ctx = new AudioCtx()
    const now = ctx.currentTime
    const notes = [392.0, 523.25, 659.25, 783.99] // G4, C5, E5, G5

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, now + i * 0.12)
      gain.gain.linearRampToValueAtTime(0.2, now + i * 0.12 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.3)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + i * 0.12)
      osc.stop(now + i * 0.12 + 0.35)
    })

    setTimeout(() => void ctx.close(), 1000)
  } catch {
    // Silencioso si el navegador bloquea audio sin interacción previa del usuario.
  }
}
