import type { Sound } from "./game/engine"

// Every sound is synthesized with the Web Audio API, so there are no audio files to load
let audio: AudioContext | null = null
let master: GainNode | null = null
const lastPlayed: Partial<Record<Sound, number>> = {}

const context = () => {
  if (!audio) {
    audio = new AudioContext()
    master = audio.createGain()
    master.connect(audio.destination)
  }
  if (audio.state === "suspended") void audio.resume()
  return audio
}

const tone = (freq: number, duration: number, { type = "square" as OscillatorType, volume = 0.2, slide = 0, delay = 0 } = {}) => {
  const ac = context()
  const t = ac.currentTime + delay
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + duration)
  gain.gain.setValueAtTime(volume, t)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration)
  osc.connect(gain).connect(master!)
  osc.start(t)
  osc.stop(t + duration + 0.02)
}

const noise = (duration: number, { volume = 0.3, cutoff = 1200 } = {}) => {
  const ac = context()
  const t = ac.currentTime
  const buffer = ac.createBuffer(1, Math.ceil(ac.sampleRate * duration), ac.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
  const src = ac.createBufferSource()
  src.buffer = buffer
  const filter = ac.createBiquadFilter()
  filter.type = "lowpass"
  filter.frequency.value = cutoff
  const gain = ac.createGain()
  gain.gain.value = volume
  src.connect(filter).connect(gain).connect(master!)
  src.start(t)
}

// Rapid sounds are spaced out so they don't pile up into noise
const MIN_GAP: Partial<Record<Sound, number>> = { shoot: 0.05, hit: 0.04, kill: 0.03 }

export const playSound = (sound: Sound, volume: number) => {
  if (volume <= 0 || typeof window === "undefined") return
  const ac = context()
  const now = ac.currentTime
  if (now - (lastPlayed[sound] ?? -1) < (MIN_GAP[sound] ?? 0)) return
  lastPlayed[sound] = now
  master!.gain.value = volume
  switch (sound) {
    case "shoot":
      tone(880, 0.06, { volume: 0.05, slide: -500 })
      break
    case "hit":
      tone(300, 0.05, { type: "triangle", volume: 0.12 })
      break
    case "kill":
      noise(0.18, { volume: 0.22, cutoff: 1800 })
      tone(220, 0.12, { type: "triangle", volume: 0.12, slide: -150 })
      break
    case "hurt":
      noise(0.35, { volume: 0.4, cutoff: 700 })
      tone(200, 0.4, { type: "sawtooth", volume: 0.15, slide: -160 })
      break
    case "power":
      ;[523, 659, 784].forEach((f, i) => tone(f, 0.12, { type: "triangle", volume: 0.15, delay: i * 0.06 }))
      break
    case "wave":
      tone(392, 0.15, { type: "triangle", volume: 0.15 })
      tone(587, 0.25, { type: "triangle", volume: 0.15, delay: 0.14 })
      break
    case "boss":
      ;[110, 104, 98].forEach((f, i) => tone(f, 0.35, { type: "sawtooth", volume: 0.14, delay: i * 0.3 }))
      break
    case "nuke":
      noise(0.9, { volume: 0.5, cutoff: 500 })
      tone(120, 0.8, { type: "sine", volume: 0.3, slide: -90 })
      break
    case "over":
      ;[392, 330, 262, 196].forEach((f, i) => tone(f, 0.3, { type: "triangle", volume: 0.16, delay: i * 0.18 }))
      break
  }
}
