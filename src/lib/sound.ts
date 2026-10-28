function createAudioContext(): AudioContext {
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  return new AudioCtx()
}

interface Tone {
  freq: number
  at: number
  length: number
  type?: OscillatorType
  volume?: number
  /** Frecuencia final si el tono se desliza. */
  glideTo?: number
}

/** Reproduce notas sintetizadas y libera el contexto; silencioso si el navegador bloquea el audio. */
function playTones(tones: Tone[]): void {
  try {
    const ctx = createAudioContext()
    const now = ctx.currentTime
    let end = 0
    for (const tone of tones) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const start = now + tone.at
      osc.type = tone.type ?? 'triangle'
      osc.frequency.setValueAtTime(tone.freq, start)
      if (tone.glideTo) osc.frequency.exponentialRampToValueAtTime(tone.glideTo, start + tone.length)
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(tone.volume ?? 0.15, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, start + tone.length)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(start)
      osc.stop(start + tone.length + 0.05)
      end = Math.max(end, tone.at + tone.length)
    }
    setTimeout(() => void ctx.close(), (end + 0.3) * 1000)
  } catch {
    // Silencioso si el navegador bloquea audio sin interacción previa del usuario.
  }
}

/** Campana grave que abre el resumen del día. */
export function playSummaryOpen(): void {
  playTones([
    { freq: 220, at: 0, length: 0.9, type: 'sine', volume: 0.18 },
    { freq: 329.63, at: 0.18, length: 0.9, type: 'sine', volume: 0.12 },
  ])
}

/** Tintineo de monedas al mostrarse la recompensa ganada. */
export function playCoinGain(): void {
  playTones([
    { freq: 987.77, at: 0, length: 0.14, type: 'square', volume: 0.06 },
    { freq: 1318.51, at: 0.09, length: 0.28, type: 'square', volume: 0.06 },
  ])
}

/** Golpe sordo al mostrarse la vida perdida. */
export function playDamageThud(): void {
  playTones([
    { freq: 140, glideTo: 45, at: 0, length: 0.35, type: 'sine', volume: 0.3 },
    { freq: 90, glideTo: 40, at: 0.02, length: 0.3, type: 'sawtooth', volume: 0.06 },
  ])
}

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

/** Chasquido de látigo: ráfaga de ruido con filtro que cae de agudo a grave. */
export function playWhip(): void {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    const ctx = new AudioCtx()
    const now = ctx.currentTime
    const duration = 0.18

    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1

    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.Q.value = 4
    filter.frequency.setValueAtTime(5000, now)
    filter.frequency.exponentialRampToValueAtTime(700, now + duration)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.5, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    noise.start(now)
    noise.stop(now + duration)

    setTimeout(() => void ctx.close(), 500)
  } catch {
    // Silencioso si el navegador bloquea audio.
  }
}
